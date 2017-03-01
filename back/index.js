var http = require('http');
var url	 = require('url'); //for parsing get request
var qs 	 = require('querystring'); //for parsing post request
var bl 	 = require('bl');
var webStr = '';
var legitReqHeaders = {
	//"user-agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
	"user-agent" : "NokiaC3-00/5.0 (07.80) Profile/MIDP-2.1 Configuration/CLDC-1.1 Mozilla/5.0 AppleWebKit/420+ (KHTML, like Gecko) Safari/420+",
	"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
	"accept-encoding":"gzip, deflate, sdch, br",
	"accept-language":"en-US,en;q=0.8",
	"connection":"Keep-Alive",
	"referer" : "https://www.google.com"
};



function extractTag(tag, str){

	str += ''; //converting to string
    stripeddata = [];
    if(str.indexOf('<'+tag+'>') >0 || str.indexOf('<'+tag+' ') >0){
        //hoping only these case exist.!
        chunks  = str.split('<'+tag+'>');
        chunks2 = str.split('<'+tag+' ');

        if(chunks.length>1){
            for(i=1 ; i< chunks.length; i++){
            paraend     =   chunks[i].indexOf('</'+tag+'>');
            stripeddata +=  chunks[i].slice( 0 , paraend);
            }
        }

        if(chunks2.length>1){
            for(i=1 ; i< chunks2.length; i++){
            paraend     =   chunks2[i].indexOf('</'+tag+'>');
            tagend      =   chunks2[i].indexOf('>');
            stripeddata +=  chunks2[i].slice( tagend+1 , paraend);
            }
        }
        

    }

    return stripeddata;

}

function acquireData(target, callback){

	var legitReqOptions = {
		hostname : target,
		port : 80,
		method : 'GET',
		headers : legitReqOptions
    };
    //var getData = {};
	var req = http.request(target, (res) => {
				res.pipe(bl(function (err,data){
				  	console.log(' tistbd : ', data.toString());
				  	webStr = data;
				  	callback();
				  }));
			}).on('error', (e) => {
			  		console.log(`Got error: ${e.message}`);
			});
	//req.write();
	req.end();
}




http.createServer(function (req, res) {

		console.log('clientAlive\n');
		var reqJson = url.parse(req.url, true);

	 	if (req.method ==='POST') {
	 		
	 		//Expecting the Raw data to be JSON object
	 		var body = []; // for hex data buffer
	 		var bodyStr = []; 
	 		var target = [];
	 		req.on('data', function(chunk){
	 			body.push(chunk);
	 			//console.log(chunk);
	 			//To avoid server crash
	 			if(body.length > 1e6 )
	 				req.connection.destroy();
	 		}).on('end', function(){
	 			bodyStr= Buffer.concat(body).toString();
	 			console.log(bodyStr);
	 			//console.log(bodyStr);
	 			//bodyStr = '\\' + bodyStr ; 
	 			//req.write put inside 'end' event to prevent earlier execution
		 		res.writeHead(200, {'Content-Type': 'text/plain'});

		 		target = qs.parse(bodyStr).url;

		 		// endreq() ends the request to be sent back to the client.
		 		// This line of code is put in a separate funtion for executing 
		 		// it only after the data is scraped completely. 
		 		// endreq() is passed as a callback to the function 
		 		// acquireData(). This callback (that is endreq() ) will be executed 
		 		// only after complete data is received.!
		 		// Took my 3 - 4 hours man !

		 		// Main funda is , I suppose the event 'end' waits for response object
		 		// ( res ) to get closed. Otherwise , there is a possibility that 
		 		// acquireData() gets executed, then the async  for scraping data fires,
		 		// simultaneously, execution can go further to next line ( line after 
		 		// acquireData() ) , which is end of the event response code. 

		 		// Pure luck , ? validate ! 
		 		// Yep , validated. The hypothesis proposed is true. So, this hack works
		 		// only in this context. 

		 		function endreq(){
		 			gen = extractTag('p', webStr);
		 			res.end( '' + gen);
		 			//console.log(webStr);
		 		}	

		 		acquireData(target, endreq);

		 		console.log('i got executed');
	 		});

	 	}
	  	
	  	else{

	  		var body = [];
	  		var bodyStr = [];
	  		req.pipe(bl(function (err, data){

	  			//dataStr = Buffer.concat(data).toString();
		  		res.writeHead(200, {'Content-Type': 'text/plain'});
		  		res.end( '\nServer Received '+ req.method+ '\nRequest Headers : \n' 
		  			+JSON.stringify(req.headers) + '\n Body : \n' + req.url);

	  		}));
	 		
	  	}	
}).listen(8000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:8000/');

