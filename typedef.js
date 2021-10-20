/**
 * @typedef {("css"|"gif"|"html"|"ico"|"jpeg"|"js"|"json"|"mp3"|"mp4"|"mpeg"|"pdf"|"png"|"webp"|"xml")} typeMime
 */

/**
 * @typedef  {Object} gBackendConf
 * @property {String} [appFolder]       the folder where generated page are stored
 * @property {Number} [cache]           the cache duration for exemple 6 months 2678400000 * 6,
 * @property {Object} [defaultHeaders]  the headers to add in each page for example { "Connection" : "keep-alive" }
 * @property {String} [errorPage]       a custom error page
 * @property {String} [generatedFolder] the folder where generated page are stored
 * @property {String} [indexPage]       the page to call when slug is /
 * @property {Boolean}[logErrors]       details errors in console
 * @property {String} [publicFolder]    a folder where all statics resources are
 */

/**
 * @typedef    {Object}         gBackendRequest   the simplified request sent from client
 *
 * @property   {Object}         [body]
 * @property   {Object}         [errors]          only filled with errors when render failled
 * @property   {String | null}  [extension]
 * @property   {Object}         headers
 * @property   {String}         method   ("GET" | "POST" | "PUT" | "DELETE" | "PATCH")
 * @property   {String}         url
 * @property   {String}         [uri]
 * @property   {Array}          [uriArray]
 * @property   {Number}         [status]
 */

/**
 * @typedef    {Object}    gBackendResponse   the simplified request sent from client
 * @property   {Number}    [status]
 * @property   {String}    [body]
 * @property   {String}    [headers]
 * @property   {Object}    [page]
 * @property   {typeMime}  [typeMime]
 */

/**
 * @typedef    {Object}             greenBackendPage      the page to send to client
 * @property   {String}             [body]
 * @property   {Number}             [cache]               cache duration
 * @property   {String | Object}    [headers]
 * @property   {Boolean}            [readyToBeSent]       if defined and true skip follwing middleware
 * @property   {gBackendRequest}    [request]
 * @property   {Number}             [status]
 * @property   {String}             [staticFile]
 * @property   {Boolean}            [staticForGetRequest] allow to build a static page (GET only)
 * @property   {typeMime | null}    [typeMime]
 */

/**
 * @typedef    {Object & gBackendResponse}  greenBackendError   the simplified request sent from client
 * @property   {Object}                     [detais]            details about the error;
 * @property   {greenBackendPage}           [failedPage]        the page what was rendering
 * @property   {String}                     [msg]
 * @property   {Boolean}                    [noBuild]           use this property if you don't need to build an error page and just return a message
 * @property   {Object}                     [stack]
 * @property   {Number}                     [status]
 */

module.exports = {};