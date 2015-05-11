var config = require('./config.json'),
 colors = require('colors'),
 io = require('socket.io')(config.server.port),
 mdns = require('mdns'),
 _ = require('lodash'),
 triggers = ['#supermarche', '#appartement-shazam', '#appartement-mi-temps', '#dans-la-ville', '#fan-zone-precommande', '#fan-zone-selfie', '#bar'],
 shortid = require('shortid'),
 pathHelper = require('path'),
 imagemagick = require('imagemagick-native'),
 fs = require('fs');

triggersA = _.map(triggers, function(n) { return 'A' + n ; });
triggersB = _.map(triggers, function(n) { return 'B' + n ; });
triggers = triggers.concat(triggersA).concat(triggersB);

console.log('listening on port', config.server.port);

var ad = mdns.createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port);
ad.start();

io.on('connection', function (socket) {
  console.log('connection'.bold.green);
  socket
  .on('disconnect', function () {
    console.log('disconnect'.bold.red);
  })
  .on('error', function (err) {
    console.log('error'.bold.red);
    console.log(err);
  })
  .on('write-img', function(img){
    console.log('img'.cyan);

    var base64Data = img.replace(/^data:image\/png;base64,/, ""),
    name = shortid.generate()+".png",
    path = config.server.destinationPath,
    tmpPath = config.server.tmpDestinationPath,
    destinationFile = pathHelper.join(path, name);
    tmpDestinationFile = pathHelper.join(tmpPath, name);

    console.log(tmpDestinationFile);

    fs.writeFile(tmpDestinationFile , base64Data, 'base64', function(err) {
      if(err){
        console.log('error while writing: '.bold.red);
        console.log(err);
      } else {
        fs.writeFileSync(destinationFile, imagemagick.convert({
            srcData: fs.readFileSync(tmpDestinationFile),
            width: 1920,
            height: 1080,
            resizeStyle: 'aspectfill', // is the default, or 'aspectfit' or 'fill'
            gravity: 'Center' // optional: position crop area when using 'aspectfill'
        }));
      }
    });
    // socket.broadcast.emit('new-fan-img', img);
  })
  .on('new-media', function(data){
    io.emit('new-media', data);
  })
  .on('goLive', function(){
    io.emit('live');
  })
  .on('goScreensaver', function(){
    io.emit('screensaver');
  })
  .on('shootHands', function(){
    console.log('shootHands');
    io.emit('shootHands');
  })
  .on('tactileConnection', function(){
    console.log('Tactile connexion'.bold.cyan);
  })
  .on('signature', function(data){
    // data contains property img with the dataUrl of the signature
    // console.log(data);
    io.emit('addSignature', data);
  })
  .on('confirm-image', function(){
    io.emit('confirm-image');
  })
  .on('retry', function(){
    io.emit('retry');
  })
  .on('backHome', function(){
    console.log('back home');
    io.emit('backHome');
  })
  .on('startTimer', function(){
    console.log('start timer');
    io.emit('startTimer');
  })
  .on('shoot', function(data){
    io.emit('shoot', data);
  });
});
