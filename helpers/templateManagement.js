import config from "../config.js";
import { __dirname } from "../constants.js";
import { readLogFileData } from "../lib/helperFunc.js";

async function getTemplateByName(templateName, templateData) {
  templateName = typeof templateName === "string" ? templateName : false;
  if (!templateName) return { error: "No template name found", data: null };

  const templateRoute = `${__dirname}/templates`;

  const { error: headerError, data: headerHtml } = await readLogFileData(`${templateRoute}/_header.html`);
  if (headerError && !headerHtml) return { error: "Header template not being able to fetched", data: null };

  const { error: footerError, data: footerHtml } = await readLogFileData(`${templateRoute}/_footer.html`);
  if (footerError && !footerHtml) return { error: "Footer template not being able to fetched", data: null };

  const { error, data: templateHtml } = await readLogFileData(`${templateRoute}/${templateName}.html`);
  if (error && !templateHtml) return { error: "No template could be found!", data: null };

  const htmlTemplate = `${headerHtml}${templateHtml}${footerHtml}`;
  const interpolatedHtml = htmlDataInterpolation(htmlTemplate, templateData);

  return { error: false, data: interpolatedHtml };
}

function htmlDataInterpolation(htmlString, data) {
  htmlString = typeof htmlString === "string" && htmlString.length > 0 ? htmlString : "";
  data = typeof data === "object" && data !== null ? data : {};
  
  const { globalTemplateVars } = config;
  for(var globalKey in globalTemplateVars) {
    if (globalTemplateVars.hasOwnProperty(globalKey))
      data[`global.${globalKey}`] = globalTemplateVars[globalKey];
  }

  //:- After adding all the globals we will replace the data in template
  for(var key in data) {
    var find = `{${key}}`;
    htmlString = htmlString.replace(find, data[key]);
  }

  return htmlString;
}

export {
  getTemplateByName,
};
