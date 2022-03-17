import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Controller } from "../../../server/controllers/index.js";
import { Service } from "../../../server/services/index.js";
import TestUtil from "../_util/testUtil.js";

describe("#Controller - test suite for API control", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("getFileStream - should return a file stream", async () => {
    const mockFileStream = TestUtil.generateReadableStream(["data"]);
    const expectedType = ".html";

    jest
      .spyOn(Service.prototype, Service.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType,
      });

    const controller = new Controller();
    const controllerReturn = await controller.getFileStream("/index.html");

    expect(Service.prototype.getFileStream).toHaveBeenCalledTimes(1);
    expect(Service.prototype.getFileStream).toBeCalledWith("/index.html");
    expect(controllerReturn).toStrictEqual({
      stream: mockFileStream,
      type: expectedType,
    });
  });
});
