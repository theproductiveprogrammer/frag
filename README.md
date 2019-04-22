# Frag - The Simple Webserver

Ever wanted to quickly spin up a website? `Frag` is perfect when all you
want is to:

1. Have a site with a basic a theme and content
2. Capture user inputs

`Frag` handles generating the site for you from the templates, and
accepts user inputs from URL-parameters, POST body, or JSON-encoded
data.

![frag icon](frag.png)


## Use

First add the package to your repository using your favorite package
manager:

        $> yarn add @tpp/frag


Then require it and use it in your code.

```
const frag = require('frag')

/* start the web server on port 3003
 * taking the fragments from src/
 * and generate the HTML sites in public/
 *
frag.start(3003, 'src', 'public', data, (err) => {
    if(err) console.error(err)
    else console.log(`Site started on ${port}`))
})
```

And example layout would look like:

```
myproject/
    index.js
    src/
        _layout.html
        index.html
        page1.html
        page2.html

        different_theme/
            _layout.html
            index.html
            page3.html
            page4.html

    public/
        img/
            banner.jpg
            ...
        css/
            site.css
            ...
        js/
            site.js
            ...
        favicon.ico
        index.html
        page1.html
        page2.html
        different_theme/
            index.html
            page3.html
            page4.html
```



## Templates
Most sites have a framework/template surrounding the content:

```
    +-----------------------+   +-----------------------+
    |  FRAMEWORK/TEMPLATE   |   |  FRAMEWORK/TEMPLATE   |
    |                       |   |                       |
    |     ............      |   |     ............      |
    |                       |   |                       |
    |     ............      |   |     ............      |
    |                       |   |                       |
    |   [Actual Content     |   |   [Different Content  | . . .
    |       Fragment]       |   |       Fragment]       |
    |                       |   |                       |
    |     ............      |   |     ............      |
    |                       |   |                       |
    +-----------------------+   +-----------------------+
```

`Frag` combines the framework/template with the content to produce the
actual pages it can serve.

Both the framework/tempate and the content are simple HTML files in a
folder. The content files can start with some properties and the rest of
the file is referenced as `CONTENT`.

```
TITLE = Easter Offer
DESCRIPTION = 50% off on the best eBook this side of heaven

<div class=container>
    <div ...
</div>
```

The framework/template is a special file called
`_layout.html` that contains `$$CONTENT$$` and other `$$PROPERTIES$$`
that will be replaced by the property values in the content html files.

```
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>$$TITLE$$</title>
    <meta name="description" content="$$DESCRIPTION$$">
    ...
</head>
<body>

    $$CONTENT$$

    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>

</body>
</html>
```

**NOTE: The properties are replaced LITERALLY without any HTML escaping.
This means you should make sure that the property values do not break
your HTML**

Different folders can have different `_layout.html` files for different
parts of your site. Folders without `_layout.html` files are simply
served without any processing.


## User Input and Redirects

`Frag` saves user input using the append-only log database
[Kore](https://www.npmjs.com/package/koredb). Processing of these
records can be done by adding Kore processors by accesing the `kore`
instance using `frag.kore()` and then calling
[`addProcessor()`](https://github.com/theproductiveprogrammer/koredb/blob/master/docs/START.md)

`Frag` saves any user input to the endpoint `/save`. It can optionally
take a `nxt` parameter and generate a redirect request so the browser
moves to the next page after saving the current request.

1. As URL
        site.com/save?nxt=index.html&my=data&more=data
2. As a HTML form
```
    <form action="/save" method="POST">
        <input type="text" name="name"></input>
        <input type="hidden" name="secret" value="ilikeyou"></input>
        <input type="hidden" name="nxt" value="page2.html"></input>
        <button type="submit" class="btn btn-primary">Submit</button>
    </form>
```
3. Or as an AJAX Request
```
    function save(data, cb) {
        let url_ = '/save'
        let xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function() {
            if(xhr.readyState !== XMLHttpRequest.DONE) return
            if(xhr.status !== 200) cb(xhr)
            else cb(null, xhr)
        }
        xhr.open('POST', url_)
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.send(JSON.stringify(data))
    }
```


### Tracking ID
Frag automatically sets a tracking id (`trid`) to user requests so you
know which set of answers came from a given user.

# Feedback
Have something to suggest? Let me know.

