const http = require('http');
const fs = require('fs');
const PORT = 8000;

const Country=require('country-state-city').Country;
const State=require('country-state-city').State;
const City=require('country-state-city').City;
const homeFile = fs.readFileSync('home.html', 'utf-8');
const sendJSONResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

const replaceHtmlVariable = (htmlFile, whetherData) => {
    const tempInCel= (whetherData.main.temp - 273.15).toFixed(2);
    const minTempInCel=(whetherData.main.temp_min -273.15).toFixed(2);
    const maxTempInCel= (whetherData.main.temp_max - 273.15).toFixed(2);
    let tempHtmlFile = htmlFile
        .replace("{%location%}", whetherData.name)
        .replace("{%country%}", whetherData.sys.country)
        .replace("{%temp%}",tempInCel)
        .replace("{%temp_min%}",minTempInCel)
        .replace("{%temp_max%}",maxTempInCel)

    return tempHtmlFile;
}


const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");

    if (req.url == '/') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(homeFile)
        // http.request("http://api.openweathermap.org/data/2.5/weather?q=kolkata&appid=33ea8dd70ee6e75a087efefd7c0ea1f3", (apiRes) => {
        //      let data='';
        //     apiRes.on('data', (chunk) => {
        //         data += chunk;
        //     });


        //     apiRes.on('end', () => {

        //         try {
        //             const whetherData = JSON.parse(data);
        //             const realTimeData = replaceHtmlVariable(homeFile, whetherData);
        //             //console.log("realTimeData--",realTimeData);
                    
        //             res.writeHead(200, {'Content-Type': 'text/html'});
        //             res.end(realTimeData, 'utf-8', () => {
        //                 console.log("Writing HTML data...");
        //             });
        //         } catch (error) {
        //             console.error("Error parsing data: ", error);
        //             res.writeHead(500, {'Content-Type': 'text/plain'});
        //             res.end("Internal Server Error");
        //         }
                
        //     })
        // }).end()
      
    } else if(req.method==='GET' && req.url=='/getCountries'){
      
      try{
        sendJSONResponse(res,200,{message:'Country name send successfully',countries:Country.getAllCountries()})
      } catch(err){
        sendJSONResponse(res, 400, { message: 'Invalid JSON' });
      }

    } else if(req.method==='POST' && req.url=='/getStates'){
        let body='';
        req.on('data',chunk=>{
          body += chunk.toString();   
        });
        
        req.on('end',()=> {
               try {
                const parsedBody = JSON.parse(body);
                const countryCode=parsedBody.countryCode;
                sendJSONResponse(res,200,{message:'Country code received successfully',countryCode:countryCode, allStates:State.getStatesOfCountry(countryCode)})

               } catch (error) {
                sendJSONResponse(res, 400, { message: 'Invalid JSON' });
               }
        });

    } else if(req.method==='POST' && req.url=='/getCities'){
        let body="";
        req.on('data',chunk=>{
          body+=chunk.toString();
        });

        req.on('end',()=> {
          try {
           const parsedBody = JSON.parse(body);
           const countryCode=parsedBody.countryCode;
           const stateCode=parsedBody.stateCode;

           sendJSONResponse(res, 200 ,{message:'Country code and State code received successfully',countryCode:countryCode, stateCode:stateCode, allCities:City.getCitiesOfState(countryCode,stateCode)})

          } catch (error) {
           sendJSONResponse(res, 400, { message: 'Invalid JSON' });
          }
   });


    } else if (req.method === 'POST' && req.url =='/sendString') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
       
        
        req.on('end', () => {
           try{
            const parsedBody = JSON.parse(body);
            const stringValue = parsedBody.value;
            const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${stringValue}&appid=33ea8dd70ee6e75a087efefd7c0ea1f3`;
            http.get(apiUrl, (apiRes) => {
                let data = '';
                
                apiRes.on('data', (chunk) => {
                  data += chunk;
                });
                
                apiRes.on('end', () => {

                  sendJSONResponse(res, 200, { message: 'String received successfully', value: stringValue, weatherData: JSON.parse(data) });
                });
      
              }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
                sendJSONResponse(res, 500, { message: 'Error fetching weather data', error: e.message });
              });
           }catch(err){
            sendJSONResponse(res, 400, { message: 'Invalid JSON' });
           }
          
        });
      } 
    //res.end('welcome to node js')
})


server.listen(PORT, () => {
    console.log(`Server running at Port: ${PORT}`);
});