/* global katex */
var splitAtDelimiters = require("./splitAtDelimiters");

var splitWithDelimiters = function (text, delimiters) {
    var data = [{type: "text", data: text}];
    for (var i = 0; i < delimiters.length; i++) {
        var delimiter = delimiters[i];
        data = splitAtDelimiters(
            data, delimiter.left, delimiter.right,
            delimiter.display || false);
    }
    return data;
};

var loadMathJax = function (element) {
    if(typeof MathJax !== 'undefined'){
        // mathjax successfully loaded, let it render
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
    }else {
        var mjaxURL = "http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML&delayStartupUntil=configured";
        // load mathjax script
        $.getScript(mjaxURL, function () {
            // Configuration
            var head = document.getElementsByTagName("head")[0], script;
            script = document.createElement("script");
            script.type = "text/x-mathjax-config";
            script[(window.opera ? "innerHTML" : "text")] =
                "MathJax.Hub.Config({\n" +
                " \"HTML-CSS\": {scale: 150}\n" +
                "});";
            head.appendChild(script);
            MathJax.Hub.Configured();
            // mathjax successfully loaded, let it render
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        });
    }
};

var renderMathInText = function (text, delimiters) {
    var data = splitWithDelimiters(text, delimiters);

    var fragment = document.createDocumentFragment();

    for (var i = 0; i < data.length; i++) {
        if (data[i].type === "text") {
            fragment.appendChild(document.createTextNode(data[i].data));
        } else {
            var span = document.createElement("span");
            var math = data[i].data;
            try {
                katex.render(math, span, {
                    displayMode: data[i].display
                });
            } catch (e) {
                if (!(e instanceof katex.ParseError)) {
                    throw e;
                }
                span.appendChild(document.createTextNode(data[i].rawData));
                loadMathJax(span);
            }
            fragment.appendChild(span);
        }
    }

    return fragment;
};

var renderElem = function (elem, delimiters, ignoredTags) {
    for (var i = 0; i < elem.childNodes.length; i++) {
        var childNode = elem.childNodes[i];
        if (childNode.nodeType === 3) {
            // Text node
            var frag = renderMathInText(childNode.textContent, delimiters);
            i += frag.childNodes.length - 1;
            elem.replaceChild(frag, childNode);
        } else if (childNode.nodeType === 1) {
            // Element node
            var shouldRender = ignoredTags.indexOf(
                    childNode.nodeName.toLowerCase()) === -1;

            if (shouldRender) {
                renderElem(childNode, delimiters, ignoredTags);
            }
        }
        // Otherwise, it's something else, and ignore it.
    }
};

var defaultOptions = {
    delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "\\[", right: "\\]", display: true},
        {left: "\\(", right: "\\)", display: false}
        // LaTeX uses this, but it ruins the display of normal `$` in text:
        // {left: "$", right: "$", display: false}
    ],

    ignoredTags: [
        "script", "noscript", "style", "textarea", "pre", "code"
    ]
};

var extend = function (obj) {
    // Adapted from underscore.js' `_.extend`. See LICENSE.txt for license.
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
        source = arguments[i];
        for (prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                obj[prop] = source[prop];
            }
        }
    }
    return obj;
};

var renderMathInElement = function (elem, options) {
    if (!elem) {
        throw new Error("No element provided to render");
    }

    options = extend({}, defaultOptions, options);

    renderElem(elem, options.delimiters, options.ignoredTags);
};

module.exports = renderMathInElement;
