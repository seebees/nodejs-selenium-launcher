var fs           = require('fs')
  , path         = require('path')
  , request      = require('request')
  , hashFile     = require('hash_file')
  , spawn        = require('child_process').spawn
  , freeport     = require('freeport')
  , EventEmitter = require('events').EventEmitter
  , util         = require('util')

var remoteLibs = {
      selenium: {
      , version: '2.39.0'
      , filename: 'selenium-server-standalone-$VERSION.jar'
      , url: 'http://selenium-release.storage.googleapis.com/$VERSION/'
      , expectedSha: 'f2391600481dd285002d04b66916fc4286ff70ce'}
      , platform: {
          linux_x32: {
            chrome: {
              url: 'http://chromedriver.storage.googleapis.com/2.9/chromedriver_linux32.zip'
            , filename: 'chromedriver_linux32.zip'
            , expectedSha: '780c12bf34d4f4029b7586b927b1fa69'}
          }
        , linux_x64: {
            chrome: {
              url: 'http://chromedriver.storage.googleapis.com/2.9/chromedriver_linux64.zip'
            , filename: 'chromedriver_linux64.zip'
            , expectedSha: 'e2e44f064ecb69ec5b6f1b80f3d13c93'}
          }
        , darwin: {
            chrome: {
              url: 'http://chromedriver.storage.googleapis.com/2.9/chromedriver_mac32.zip'
            , filename: 'chromedriver_mac32.zip'
            , expectedSha: 'd33f5bbea74968610b5face51a533419'}
          }
        , win32: {
            chrome: {
              url: 'http://chromedriver.storage.googleapis.com/2.9/chromedriver_win32.zip'
            , filename: 'chromedriver_win32.zip'
            , expectedSha: 'ef6a4819563ef993c3aac8f229c0ca91'}
            ie: {
              url: 'https://selenium.googlecode.com/files/IEDriverServer_Win32_2.39.0.zip'
            , filename: 'IEDriverServer_Win32_2.39.0.zip'
            , expectedSha: '71b8fad1dadc72a1b7e45ade3f5c3f72d4f02def'}
          }
        , win64: {
            ie: {
              url: 'https://selenium.googlecode.com/files/IEDriverServer_x64_2.39.0.zip'
            , filename: 'IEDriverServer_x64_2.39.0.zip'
            , expectedSha: 'c7ffa258de34d0934120b269a5af76e14a62d2d4'}
        }
      }
    }


function download(url, outfile, expectedSha, cb) {
  var real = function() {
    console.log('Downloading Selenium ' + version)
    var i = 0
    request({ url: url })
      .on('end', function() {
        process.stdout.write('\n')
        cb()
      })
      .on('data', function() {
        if (i == 8000) {
          process.stdout.write('\n')
          i = 0
        }
        if (i % 100 === 0) process.stdout.write('.')
        i++
      })
      .pipe(fs.createWriteStream(outfile))
  }

  fs.stat(outfile, function(er, stat) {
    if (er) return real()
    hashFile(outfile, 'sha1', function(er, actualSha) {
      if (er) return cb(er)
      if (actualSha != expectedSha){
        return real()
      } else {
        cb()
      }
    })
  })
}

function run(op, cb) {
  freeport(function(er, port) {
    if (er) throw er
    console.log('Starting Selenium ' + version + ' on port ' + port)
    // Append op to java here
    var child = spawn('java', [
      '-jar', outfile,
      '-port', port,
    ])
    child.host = '127.0.0.1'
    child.port = port

    var badExit = function() { cb(new Error('Could not start Selenium.')) }
    child.stdout.on('data', function(data) {
      var sentinal = 'Started org.openqa.jetty.jetty.Server'
      if (data.toString().indexOf(sentinal) != -1) {
        child.removeListener('exit', badExit)
        cb(null, child)
      }
    })
    child.on('exit', badExit)
  })
}

function FakeProcess(port) {
  EventEmitter.call(this)
  this.host = '127.0.0.1'
  this.port = port
}
util.inherits(FakeProcess, EventEmitter)
FakeProcess.prototype.kill = function() {
  this.emit('exit')
}

module.exports = function(op, cb) {
  op = op || {}
  cb = typeof op === 'function' ? op : cb

  if (process.env.SELENIUM_LAUNCHER_PORT) {
    return process.nextTick(
      cb.bind(null, null, new FakeProcess(process.env.SELENIUM_LAUNCHER_PORT)))
  }

  // walk the platfor, and get the full list of files
  // download each file using async
  // add the list of cmd options to the run op value.
  download(url, outfile, expectedSha, function(er) {
    if (er) return cb(er)
    run(op, cb)
  })
}




//webdriver.ie.driver
options.push( process.platform !== 'win32' ? '' : 
              process.config.variables.host_arch === 'x64' ? '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x64.exe' :
                                                             '-Dwebdriver.ie.driver='+ base + path.sep + 'IEDriverServer.x86.exe' );

//weddriver.chrome.driver
options.push( process.platform === 'darwin' ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'mac.chromedriver' :
              process.platform === 'win32'  ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'chromedriver.exe' :
              process.platform === 'linux'  && (process.config.variables.host_arch === 'x64') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux64.chromedriver' :
              process.platform === 'linux'  && (process.config.variables.host_arch === 'x32') ? '-Dwebdriver.chrome.driver='+ base + path.sep + 'linux32.chromedriver' : '');


//https://code.google.com/p/selenium/wiki/SafariDriver

