const fs = require("fs");
let   appFolder;

function merge(template, data={}){
  this.page=function (src, data = {}) {
    return renderer(src, data, "pages/");
  };
  this.partial=function (src, data = {}) {
    return renderer(src, data, "partials/");  //TODO : voir si il ne faut pas fusionner des données avec le template dans un partial
    // return getTemplate(src, "partials/");
  };
  return Function("return `" + template + "`;").bind(data)();
}

/**
 * [renderer description]
 *
 * @param   {String}  src     [src description]
 * @param   {Object}  data    [data description]
 * @param   {String}  type
 *
 * @return  {String}          [return description]
 * @throws  {gBackendError}
 */
function renderer(src, data, type) {
  try {
    const template = getTemplate(src, type);
    return merge(template, data);
  }
  catch (err) {
    throw {
      details   : {
        data,
        err,
        src,
        type
      },
      msg       : "failed to render page",
      status    : 500
    };
  }
}

/**
 * [buildPath description]
 *
 * @param   {String}  src   le fichier template
 * @param   {String}  type  [type description]
 *
 * @return  {String}        [return description]
 */
function getTemplate(src, type) {
  if (fs.existsSync(src)) return fs.readFileSync(src, "utf-8");
  const possibilities = [
    type + src + "/template_" + src + ".html",
    type + src + ".html",
    type + src + "/" + src + ".html",
    src
  ];
  for (let i = possibilities.length - 1; i >= 0; i--) {
    possibilities[i] = process.cwd() + appFolder + "/" + possibilities[i];
    if (fs.existsSync(possibilities[i])) {
      return fs.readFileSync(possibilities[i], "utf-8");
    }
  }

  throw {
    "msg": "cannot find template ("+src+")",
    "status": 500,
  };
}

function set(folder){
  appFolder = folder;
}
module.exports = {
  render : renderer,
  set
};