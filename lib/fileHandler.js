/**
 * @typedef {import("../typedef.js").greenBackendPage}    greenBackendPage
 * @typedef {import("../typedef.js").gBackendConf}        gBackendConf
 */

// const configuration   = require("./server").getConfiguration;
const defineFileType  = require("./requestHandler").defineFileType;
const fs              = require("fs");
const getDirName = require("path").dirname;
let appFolder, generatedFolder, publicFolder;

/**
 * [classNameToFileName description]
 *
 * @param   {String}  classname  [classname description]
 *
 * @return  {String}             [return description]
 */
function classNameToFileName(classname) {
  const classnames = classname.split(" ");
  for (let i = 1, size = classnames.length; i < size; i++) {
    if (classnames[i] !== classnames[i].toLowerCase()) {
      classnames[i] = "-" + classnames[i].toLowerCase();
    }
  }
  return classnames.join("");
}

/**
 * a middleware function that send a static page if it is already generated or in public folder
 *
 * @param   {module:http.IncomingMessage}  request   the request
 * @param   {greenBackendPage}             page      the page
 * @param   {Function}                     next      the next middleware to call
 *
 * @return  {void}                                   complete page
 */
function importExistingFile(request, page, next) {
  // if ( ! request.uri ) return;
  let staticPage = process.cwd() + publicFolder + "/" + request.uri;
  if (fs.existsSync(staticPage)) return importFile(staticPage, request, page);

  staticPage = process.cwd() + generatedFolder + "/" + request.uri;
  if (fs.existsSync(staticPage)) return importGeneratedFile(staticPage, page);
  next();
}

function importFile(file,request, page){
  page.body             = fs.readFileSync(file);  //TODO voir pourquoi cette ligne était commentée
  page.readyToBeSent    = true;
  page.staticFile       = file;
  page.typeMime         = defineFileType(request.uri);
}

function importGeneratedFile(file, page){
  const { body, cache, headers, status, typeMime } = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (cache)   page.cache   = cache;
  if (headers) page.headers = headers;
  if (status)  page.status  = status;
  // eslint-disable-next-line no-constant-condition
  page.body           = body; //typeof(body !== "string") ? JSON.stringify(body) : body;
  page.readyToBeSent  = true;
  page.typeMime       = typeMime;
}

/**
 * import page if exists
 *
 * @param   {String}  page       the page name
 *
 * @return  {Object}             imported page
 * @throws  {greenBackendError}  an error
 */
function importPage(page) {
  try {
    const filename = classNameToFileName(page);
    const path = process.cwd() + appFolder + "/pages/" + filename + "/";
    const possibilities = [
      path + filename + ".js",
      path + filename + "_ssr" + ".js"
    ];
    for (let i = possibilities.length - 1; i >= 0; i--) {
      if (fs.existsSync(possibilities[i])) {
        return require(possibilities[i]);
      }
    }
    throw { msg : "requested page ("+page+") doesn't exist", status: 404 };
  }
  catch (error) {
    throw {
      "details"   : error,
      "msg"       : error.msg ? error.msg : "problem occured during importation",
      "status"    : error.status ? error.status : 500
    };
  }
}

function makeStaticPage(request, content) {
  try {
    const path = process.cwd()+generatedFolder+"/"+request.uri; //TODO enlever l'ajout du slash
    const test = fs.mkdirSync(getDirName(path), {recursive:true});
    fs.writeFileSync(path, content);
  }
  catch (e) {
    throw {
      details: e,
      msg: "error during writing static file",
      status: 500
    };
  }
}

/**
 * [removeGenerated description]
 *
 * @param   {String}  src  [src description]
 *
 * @return  {void}       [return description]
 */
function removeGenerated(src) { //TODO : finir la fonction
  try {
    const file = process.cwd() + generatedFolder + "/" + src;
    fs.unlinkSync(file);                                       // delete file
    delete require.cache[require.resolve(file)];               //remove from cache
  }
  catch (err) {
    throw {
      details   : err,
      msg       : "error in removeGenerated",
      status    : 500
    };
  }
}

/**
 * [configuration description]
 *
 * @param   {gBackendConf}  configuration  [configuration description]
 *
 * @return  {void}                 [return description]
 */
function setFileHandler(configuration){
  appFolder         = configuration.appFolder;
  generatedFolder   = configuration.generatedFolder; //TODO ajouter l'ajout du slash si absent
  publicFolder      = configuration.publicFolder;
}

module.exports = {
  classNameToFileName,
  importExistingFile,
  importPage,
  makeStaticPage,
  removeGenerated,
  setFileHandler
};