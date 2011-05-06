module.exports = (function(){
    var fs = require("fs");
    var templates = {};
    var param = /\${.*?}/g;
    // format = ${type:-name(param).  type, -, and param are optional.  minimum is ${name}
    var paramFormat = /\${\s*(?:(.*):)?(-)?([\w\._]+)(?:\(([\w\._]+)\))?\s*}/;
    var globals = {};

    function merge(data){
        var d = {}
        if (globals) {
            for (var k in globals) {
                d[k] = globals[k];
            }
        }

        if (data) {
            for (var j in data) {
                d[j] = data[j];
            }
        }

        return d;
    }

    function render(template, data){
        data = merge(data)
        var html = [];
        template = (typeof(template) === "object") ? template : templates[template];

        for (var i = 0; i < template.length; i++) {
            var s = template[i];
            if (typeof(s) === "object") {
                if (s.type === "template") {
                    var d = (s.param) ? resolve(s.param, data) : data;
                    html.push(render(templates[s.name], d));
                }
                else {
                    html.push(resolve(s.name, data) || "");
                }
            }
            else {
                html.push(s);
            }
        }

        return html.join("");
    }

    function addTemplate(name, html){
        console.log(name, html);
        templates[name] = parseTemplate(html);

        return this;
    }

    function addFromFile(name, path){
        var html;
        try {
            html = fs.readFileSync(path, "utf8");
        } catch (e) {
            throw e;
        }

        addTemplate(name, html);

        return this;
    }

    function parseTemplate(html){
        var segments = [];

        var params = html.match(param);
        if (params === null) {
            return [html];
        }

        var items = html.replace(param, "${!}").split("${!}");

        for (var i = 0; i < items.length; i++) {
            if (items[i].length !== 0) {
                segments.push(items[i]);
            }
            segments.push(parseParameter(params.shift()));
        }

        return segments;
    }

    function resolve(param, data){
        var parts = param.split(".");

        for (var i = 0; i < parts.length; i++) {
            data = data[parts[i]];
        }

        return data;
    }

    function parseParameter(param){
        if (!param)
            return "";

        var result = param.match(paramFormat);
        if (!result)
            return "";

        var o = {
            type: result[1],
            escape: (result[2] === "-"),
            name: result[3],
            param: (result[1]) ? result[4] : undefined
        };

        return o;
    }

    return {
        render: render,
        add: addTemplate,
        addFromFile: addFromFile,
        templates: templates,
        setGlobals: function(g){
            globals = g;
            return this;
        }
    }
})();