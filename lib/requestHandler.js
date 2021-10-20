/**
 * @typedef {import("../typedef.js").greenBackendPage}    greenBackendPage
 * @typedef {import("../typedef.js").typeMime}            typeMime
 */

let indexPage;

/**
 * add a information to the request
 *
 * @param   {module:http.IncomingMessage}  req   the request
 * @param   {greenBackendPage}             res   the response's page
 * @param   {Function}                     next  the next middleware to call
 *
 * @return  {void}                         call next
 */
function completeRequest(req, res, next) {
  const uri = extractUri(req.url);
  req.extension = extractExtension(uri);
  req.uri = uri;
  req.uriArray = uri.split("/");
  next();
}

/**
 * allow to kwnow what kind of answer is expected based on extension or path is extension is not defined
 *
 * @param   {String}  file  the requested uri
 *
 * @return  {typeMime | null}        the page's extension
 */
function defineFileType(file) {
  const end = file.lastIndexOf(".");
  if (end === -1) {
    return defineFileTypeFromPath(file);
  }
  let extension = file.slice(end + 1).toLowerCase();
  if (extension === "jpg") {
    extension = "jpeg";
  }
  // @ts-ignore
  return extension;
}

/**
 * allow to kwnow what kind of answer is expected following asked path
 *
 * @param   {String}              file  the requested uri
 *
 * @return  {typeMime | null}        the type of answer
 */
function defineFileTypeFromPath(file) {
  const arr = file.split("/");
  if (arr.indexOf("api") > -1) return "json";
  return null;
}

function extractBody(request, page, next){
  if (request.body) {
    request.body = JSON.parse(request.body); //TODO se documenter pour eviter les failles de sécurité lors de la désérialisation et vérifier que c'est utile car déjà fait dans listen il me semble
  }
  next();
}

/**
 * [extractExtension description] //TODO: faire la description
 *
 * @param   {String}  uri  [uri description]
 *
 * @return  {null | String}       [return description]
 */
function extractExtension(uri) {
  const extension = /(?:\.([^.]+))?$/.exec(uri)[1];
  return extension ? extension.toLowerCase() : null;
}

/**
 * [extractUri description]
 *
 * @param   {String}  url  [url description]
 *
 * @return  {String}       [return description]
 */
function extractUri(url) {
  let uri = url.toLowerCase();
  if (uri === "/") {
    uri = indexPage;
  }
  if (uri.slice(0, 1) === "/") {
    uri = uri.slice(1);
  }
  if (uri.slice(-1) === "?") {
    uri = uri.slice(0, -1);
  }
  return uri;
}

/**
 * return a 404 error if extension is image, js or css
 *
 * @param   {module:http.IncomingMessage}  req   the request
 * @param   {module:http.ServerResponse}   res   the response
 * @param   {Function}                     next  the next middleware to call
 *
 * @return  {Promise.<void>}                               call next
 */
async function filterExtension(req, res, next) {
  if (req.extension === null)  return next();
  if (["css", "gif", "ico", "jpg", "jpeg", "js", "mp3", "mp4", "mpeg", "pdf", "png", "svg", "webp"].indexOf(req.extension) > -1) {
    throw {
      msg       : "file not found on this server",
      noBuild   : true,
      status    : 404
    };
  }
  next();
}

function setIndexPage(page){
  indexPage = page;
}

module.exports = {
  completeRequest,
  defineFileType,
  defineFileTypeFromPath,
  extractBody,
  filterExtension,
  setIndexPage
};