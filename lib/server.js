/**
 *  @typedef {import("../typedef.js").gBackendConf}        gBackendConf
 *  @typedef {import("../typedef.js").greenBackendError}   greenBackendError
 *  @typedef {import("../typedef.js").greenBackendPage}    greenBackendPage
 *  @typedef {import("../typedef.js").gBackendRequest}     gBackendRequest
 *  @typedef {import("../typedef.js").typeMime}            typeMime
 *  */

const {
  completeRequest,
  defineFileType,
  extractBody,
  filterExtension,
  setIndexPage
} = require("./requestHandler");

const {
  importPage,
  importExistingFile,
  makeStaticPage,
  setFileHandler
} = require("./fileHandler");

const extensions = {
  "css"   : "text/css",
  "gif"   : "image/gif",
  "html"  : "text/html",
  "ico"   : "image/x-icon",
  "jpeg"  : "image/jpeg",
  "js"    : "application/javascript",
  "json"  : "application/json",
  "mp3"   : "audio/mpeg",
  "mp4"   : "video/mp4",
  "mpeg"  : "video/mpeg",
  "pdf"   : "application/pdf",
  "png"   : "image/png",
  "svg"   : "image/svg+xml",
  "webp"  : "image/webp",
  "xml"   : "application/xml",
};
const fs    = require("fs");
const http  = require("http");

/**
 * default server's configuration
 *
 * @type {gBackendConf}
 */
let configuration = {
  appFolder         : "/app",
  generatedFolder   : "/generated",
  publicFolder      : "/public",
};

let middlewares = [
  extractBody,           //extract the body of the request
  completeRequest,       //add some information
  importExistingFile,    //return a generated page if it exists
  filterExtension,       //return a 404 error if extension is image or css
];

async function applyMiddlewares(request, page) {
  try {
    for (const middlewareFunction of middlewares) {
      await middlewareFunction(request, page, () => { return; });
      if (page.readyToBeSent) break;
    }
  }
  catch (err) {
    throw err;
  }
}

/**
 * build page content
 *
 * @param   {module:http.IncomingMessage}  request   therequest
 * @param   {greenBackendPage}             page  pFront simplified request
 *
 * @return  {Promise<Object>}                    update page with content and type
 * @throws  {greenBackEndError}                  throw error
 */
async function buildPage(request, page) {
  try {
    const imported = importPage(request.uriArray[0]);
    const finalPage = await executePage(request, page, imported);
    if (!finalPage.typeMime) finalPage.template = "html";
    switch (finalPage.typeMime) {
      case "json":
        page.body = JSON.stringify(finalPage.body);
        break;
      case "html":
        const renderer = require("./renderer/html");
        renderer.set(configuration.appFolder); //TODO voir si n il ne faut pas le déplacer
        page.body = renderer.render(finalPage.template, finalPage.data, "pages/");
        break;
      case "xml":
        page.body = require("./renderer/xml")(finalPage.data, true);
        break;
      default:
        throw { msg: "unsupported typeMime : " + finalPage.typeMime, status: 500 };
    }
    for (const [key, value] of Object.entries(finalPage)) {
      page[key] = value;
    }
  }
  catch (err) {
    throw { //TODO : check throw standards
      "failedPage"    : page,
      "msg"           : err.msg,
      "request"       : request,
      "status"        : err.status,
      "details"        : err.details,
    };
  }
}

/**
 * [getMiddlewares description]
 *
 * @return  {Array<Function>}  [return description]
 */
function getMiddlewares() {
  return middlewares;
}

/**
 * [listen description]
 *
 * @param   {Number}  port  [port description]
 *
 * @return  {void}          [return description]
 */
function listen(port) {
  const server = http.createServer((serverRequest, serverResponse) => {
    const body = [];
    setFileHandler(configuration);
    setIndexPage(configuration.indexPage);
    serverRequest
      .on("error", (err) => console.warn("/*/*/*/*/*/*/*/", err))//(err) => errorHandler(err))
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", () => {
        executeRequest({
          body: Buffer.concat(body).toString(),
          headers: serverRequest.headers,
          method: serverRequest.method,
          url: serverRequest.url
        }, serverResponse);
      });
  });
  server.listen(port);
}

/**
 * [errorHandler description]
 *
 * @param   {Error | greenBackendError}  error
 * @param   {Object}                     request
 * @param   {Object}                     page
 *
 *
 * @return  {Promise.<void>}           [return description]
 */
async function errorHandler(error, request, page) {
  if ( ! error.stack) error.stack = new Error().stack;
  if (configuration.logErrors) {//TODO compléter la fonction
    [
      "details",
      "stack",
      "failedPage",
      "msg",
      "status",
    ].forEach(detail => {
      if (error[detail]) console.error(detail,error[detail]);
    });
  }

  if (configuration.errorPage && !error.noBuild) {
    request.uriArray[0]   = configuration.errorPage;
    request.errors        = error;
    await buildPage(request, page);

    return;
  }
  page.status = error.status || 500;
  page.body = "error " + page.status + (error.msg ? "\n" + error.msg : "");
}

async function executePage(request, page, pageBuilder) {
  const newPage = pageBuilder.constructor.name === "AsyncFunction" ? await pageBuilder(request, page) : pageBuilder(request, page);
  if (!newPage.typeMime) newPage.typeMime = defineFileType(request.uri); //define type mine
  // if (! newPage.status) newPage.status = 200; //will be done in makeHeaders
  return newPage;
}

/**
 * [executeRequest description]
 *
 * @param   {Object}               request
 * @param   {Object}               request.body
 * @param   {Object}               [request.errors]         that filed could be filled during this function execution. Do not use for instanciation
 * @param   {Object}               request.headers
 * @param   {String}               request.method
 * @param   {String}               request.url
 * @param   {http.ServerResponse}  response                 the response to send to the client
 *
 * @return  {promise}
 */
async function executeRequest(request, response) {
  const page = {};
  try {
    await applyMiddlewares(request, page);
    if ( ! page.body && ! page.status && ! page.staticFile) {
      await buildPage(request, page);

      //generate static page if needed
      if (request.method === "GET" && page.staticForGetRequest) {
        makeStaticPage(request, page);
      }
    }
  }
  catch (error) { //TODO : ajouter la prise en charge d'une page d'erreur custom
    await errorHandler( error, request, page );
  }
  finally {
    sendPage(response, page);
  }
}

/**
 * add headers to response
 *
 * @param   {module:http.ServerResponse}  response  [response description]
 * @param   {greenBackendPage}            page      [response description]
 *
 * @return  {void}                                  set headers in response
 */
function makeHeaders(response, page) {
  response.statusCode = page.status ? page.status : 200;
  if (configuration.defaultHeaders) {
    for (const [key, value] of Object.entries(configuration.defaultHeaders)) {
      response.setHeader(key, value);
    }
  }
  response.setHeader("Content-type", extensions[page.typeMime] || "text/plain");
  if (page.headers) {
    for (const [key, value] of Object.entries(page.headers)) {
      response.setHeader(key, value);
    }
  }
  if (page.cache) {
    response.setHeader("Cache-control", "public, max-age=" + page.cache);
  }
  response.setHeader("Content-Length", page.staticFile ? fs.statSync(page.staticFile).size : Buffer.byteLength(page.body));
}

function sendPage(response, page) {
  makeHeaders(response, page);
  if (page.staticFile) return fs.createReadStream(page.staticFile).pipe(response);
  if (page.body === undefined) page.body = "";
  if (typeof page.body !== "string") JSON.stringify(page.body);
  response.end(page.body);
}

/**
 * [setConfiguration description]
 *
 * @param   {gBackendConf}  newConfiguration  [newConfiguration description]
 *
 * @return  {void}                    [return description]
 */
function setConfiguration(newConfiguration) {
  configuration = { ...configuration, ...newConfiguration };
}

/**
 * [setConfiguration description]
 *
 * @param   {Array}  newMiddlewares  [newConfiguration description]
 *
 * @return  {void}                    [return description]
 */
function setMiddlewares(newMiddlewares) {
  middlewares = newMiddlewares;
}

module.exports = {
  getMiddlewares,
  listen,
  setConfiguration,
  setMiddlewares
};