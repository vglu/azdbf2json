
const formidable = require('formidable');
const Readable = require('stream').Readable;
var Parser = require('dbf-parser');
var fs = require('fs');

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
	const form = new formidable.IncomingForm();
	form.parse(streamify(req), (err, fields, files) => {
		/* grab the first file */
		var f = Object.values(files)[0];
		if(!f) {
            context.res = { status: 400, body: "Must submit a file for processing!" };
            context.done();
		} else {
            /* file is stored in a temp directory, so we can point to that and read it */
            let parser = new Parser(f.path);//, {encoding : fields.codepage || "utf-8"});
            
            parser.on('start', (p) => {
                console.log('dBase file parsing has started');
                //console.log(p);
            });

            parser.on('header', (h) => {
                console.log('dBase file header has been parsed');
                console.log(h);
            });

            parser.on('record', (record) => {
                console.log('record'); // Name: John Smith
                console.log(record);
            });

            parser.on('end', (p) => {
                console.log('Finished parsing the dBase file');
                console.log(p);
                context.done();
            });

            parser.parse();
            //context.done();
		}
		//context.done();
	});
};