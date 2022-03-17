import childProcess from "child_process";
import { randomUUID } from "crypto";
import { once } from "events";
import fs from "fs";
import fsPromises from "fs/promises";
import { extname, join } from "path";
import { PassThrough, Writable } from "stream";
import streamsPromises from "stream/promises";
import Throttle from "throttle";
import config from "../configs/index.js";
import { logger } from "../utils/index.js";

const {
  dir: { publicDirectory },
  constants: { fallbackBitRate, englishConversation, bitRateDivider },
} = config;

export class Service {
  constructor() {
    this.clientStreams = new Map();
    this.currentSong = englishConversation;
    this.currentBitRate = 0;
    this.throttleTransform = {};
    this.currentReadable = {};
  }

  createClientStream() {
    const id = randomUUID();
    const clientStream = new PassThrough();
    this.clientStreams.set(id, clientStream);

    return {
      id,
      clientStream,
    };
  }

  removeClientStream(id) {
    this.clientStreams.delete(id);
  }

  createFileStream(filename) {
    return fs.createReadStream(filename);
  }

  _executeSoxCommand(args) {
    return childProcess.spawn("sox", args);
  }

  async getBitRate(song) {
    try {
      const args = [
        "--i", // info
        "-B", // bitrate
        song,
      ];

      const { stdout, stderr } = this._executeSoxCommand(args);

      await Promise.all([once(stdout, "readable"), once(stderr, "readable")]);

      const [success, error] = [stdout, stderr].map((stream) => stream.read());
      if (error) return await Promise.reject(error);

      return success.toString().trim().replace(/k/, "000");
    } catch (error) {
      logger.error(error);
      return fallbackBitRate;
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [id, stream] of this.clientStreams) {
          if (stream.writableEnded) {
            this.clientStreams.delete(id);
          } else {
            stream.write(chunk);
          }
        }

        cb();
      },
    });
  }

  async startStreaming() {
    logger.info(`starting with ${this.currentSong}`);
    const bitRate = (await this.getBitRate(this.currentSong)) / bitRateDivider;
    const throttleTransform = new Throttle(bitRate);
    const songReadable = this.createFileStream(this.currentSong);
    this.currentBitRate = bitRate;
    this.throttleTransform = throttleTransform;
    this.currentReadable = songReadable;

    return streamsPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadCast()
    );
  }

  stopStreaming() {
    if (this.throttleTransform.end) {
      this.throttleTransform.end();
    }
  }

  async getFileInfo(file) {
    const fullFilePath = join(publicDirectory, file);
    await fsPromises.access(fullFilePath);
    const fileType = extname(fullFilePath);

    return {
      type: fileType,
      name: fullFilePath,
    };
  }

  async getFileStream(file) {
    const { name, type } = await this.getFileInfo(file);

    return {
      stream: this.createFileStream(name),
      type,
    };
  }
}
