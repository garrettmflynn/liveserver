export * from './Event'

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
export function getParamNames(func: Function) {
  if (func instanceof Function){
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
      result = [];
    return result;
  } else return
}


export function parseFunctionFromText(method='') {
  //Get the text inside of a function (regular or arrow);
  let getFunctionBody = (methodString) => {
    return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, '$2$3$4');
  }

  let getFunctionHead = (methodString) => {
    let startindex = methodString.indexOf(')');
    return methodString.slice(0, methodString.indexOf('{',startindex) + 1);
  }

  let newFuncHead = getFunctionHead(method);
  let newFuncBody = getFunctionBody(method);

  let newFunc;
  if (newFuncHead.includes('function ')) {
    let varName = newFuncHead.split('(')[1].split(')')[0]
    newFunc = new Function(varName, newFuncBody);
  } else {
    if(newFuncHead.substring(0,6) === newFuncBody.substring(0,6)) {
      //newFuncBody = newFuncBody.substring(newFuncHead.length);
      let varName = newFuncHead.split('(')[1].split(')')[0]
      //console.log(varName, newFuncHead ,newFuncBody);
      newFunc = new Function(varName, newFuncBody.substring(newFuncBody.indexOf('{')+1,newFuncBody.length-1));
    }
    else newFunc = eval(newFuncHead + newFuncBody + "}");
  }

  return newFunc;

}

export const randomId = (prefix?) => ((prefix) ? `${prefix}_` : '')  + Math.floor(100000*Math.random())