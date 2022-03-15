import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import config from '../../../server/config.js'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import TestUtil from '../_util/testUtil.js'

const {
  pages,
  location,
  constants: {
    CONTENT_TYPE
  }
} = config

describe("#Routes - test suite for API response", () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('GET / - should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      302,
      {
        'Location': location.home
      }
    )
    expect(params.response.end).toHaveBeenCalled()
  })
  test(`GET /home - should answer with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStream = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name,
    ).mockResolvedValue({
      stream: mockFileStream,
    })

    const pipe = jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(getFileStream).toBeCalledWith(pages.homeHTML)
    expect(pipe).toHaveBeenCalledWith(params.response)
  })

  test(`GET /controller - should answer with ${pages.controllerHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStream = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name,
    ).mockResolvedValue({
      stream: mockFileStream,
    })

    const pipe = jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(getFileStream).toBeCalledWith(pages.controllerHTML)
    expect(pipe).toHaveBeenCalledWith(params.response)
  })

  test(`GET /index.html - given an file with configured extension it should answer with file stream and correct content-type`, async () => {
    const expectedUrl = '/index.html'
    const expectedType = '.html'
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = expectedUrl
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStream = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name,
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    const pipe = jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      200,
      {
        'Content-Type': CONTENT_TYPE[expectedType]
      }
    )
    expect(getFileStream).toBeCalledWith(expectedUrl)
    expect(pipe).toHaveBeenCalledWith(params.response)
  })

  test(`GET /file.ext - given an file without configured extension it should answer without Content-Type`, async () => {
    const expectedUrl = '/file.ext'
    const expectedType = '.ext'
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = expectedUrl
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStream = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name,
    ).mockResolvedValue({
      stream: mockFileStream,
      type: expectedType
    })

    const pipe = jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(getFileStream).toBeCalledWith(expectedUrl)
    expect(pipe).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalled()
  })

  test(`METHOD /unknown - given an inexistent route for a method different than GET it should answer with 404`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/unknown'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', () => {
    test('given an inexistent file it should answer with 404', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name,
      ).mockRejectedValue(new Error('Error: ENOENT: no such file or directory'))

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test('given and error it should answer with 500', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.html'

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name,
      ).mockRejectedValue(new Error('Uncaught TypeError: Cannot read property...'))

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})