const formidable = require('formidable');
const Readable = require('stream').Readable;
var fs = require('fs');
var readDbf = require('read-dbf');
var iconv = require('iconv-lite');

/* formidable expects the request object to be a stream */
const streamify = (req) => {
	if(typeof req.on !== 'undefined') return req;
	const s = new Readable();
	s._read = ()=>{}; 
    //s.push(new Buffer(req.body));
    s.push(Buffer.from(req.body));
	s.push(null);
	Object.assign(s, req);
	return s;
};

module.exports = (context, req) => {
    const codepage = req.headers.codepage || "utf-8";
	const form = new formidable.IncomingForm();
	form.parse(streamify(req), (err, fields, files) => {
		/* grab the first file */
		var f = Object.values(files)[0];
		if(!f) {
            context.res = { status: 400, body: "Must submit a file for processing!" };
            context.done();
		} else {
            /* file is stored in a temp directory, so we can point to that and read it */
            readDbf(f.path, codepage || fields.codepage || "utf-8", function(err, res) {
                if (err !== null) {
                    context.res = { status: 400, body: err };
                    context.done();
                } else {
                    const out = iconv.decode(JSON.stringify(res), codepage);
                    context.res = {
                        status: 200,
                        headers: { "Content-Disposition": `attachment; filename="download.${f.path}";`,
                        "Content-Type": "application/json"
                    },
                        body: out
                    }; 
                }
                context.done();
            // res is an array of objects
            });
			// const wb = XLSX.read(f.path, {type:"file"});

			// /* convert to specified output type -- default CSV */
			// const ext = (fields.bookType || "csv").toLowerCase();
			// const out = XLSX.write(wb, {type:"string", bookType:ext});

		}
		//context.done();
	});
};