/////////Global Variables///////////
var camera, scene, renderer, rectangle, div, controls, manager, mixer, composer, dirLight, tween, coords, ambientlight;
var clock = new THREE.Clock();
camTarget = new THREE.Vector3(0,40,0);
var clips = [];
var clipCount = 0;
var TOD = 10;
var globalPlane;
/////////Events/////////////////////
window.addEventListener( 'resize', onWindowResize, false );
Hammer(document.getElementById('container')).on("doubletap", mixerPlay);
/////////Screen/Camera Variables////////
container = document.getElementById('container');
var aspect = $(container).width() / $(container).height();
var mouseX = 0, mouseY = 0;
var frustumSize = 1000;

init();

function init(){
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xfdf7e8 );
  
  near = -100; 
  far = 10000;
  camera = new THREE.OrthographicCamera( frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, near, far );
  camera.position.x = -20;
  camera.position.y = 200;
  camera.position.z = 20;
  camera.zoom = 4;
  camera.aspect = aspect;
  camera.target = camTarget;
  camera.updateProjectionMatrix();

  var path = 'texture/';
  var format = '.jpg';
  var envMap = new THREE.CubeTextureLoader().load( [
    path + 'posx' + format, path + 'negx' + format,
    path + 'posy' + format, path + 'negy' + format,
    path + 'posz' + format, path + 'negz' + format
  ] );

  /////////ClippingPlanes & Shadow Planes///////////
  globalPlane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0.1);
  globalPlane2 = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 5);
  var geometryPlane = new THREE.PlaneGeometry(1000,1000);
  var groundMaterial = new THREE.ShadowMaterial();
  groundMaterial.opacity = 0.2;
  var ground = new THREE.Mesh(geometryPlane, groundMaterial);
  ground.rotateX( - Math.PI / 2 );
  ground.position.y = -14;
  ground.receiveShadow = true;
  scene.add( ground );

  //////////Loader////////////////////////

  manager = new THREE.LoadingManager();
  var loader = new THREE.GLTFLoader( manager );
  
  var onProgress = function ( xhr ) {
  };
  manager.onProgress = function ( item, loaded, total ) {
    // console.log( Math.round(percentComplete, 2) + '%' );
    // var percentComplete = loaded / total * 100;  
    // document.getElementById("percentComplete").innerHTML=(Math.ceil( percentComplete ) + "%" )
  };
  manager.onLoad = function ( ) {

    console.log("fired");
   
    // $(".loader").css('visibility', 'hidden') 
    // $("#flexContainer").css('visibility', 'visible');

    clips.forEach((clip) => {
      mixer.clipAction(clip).timeScale = 0;
    });

    animate();

    var coords = { y: 200 }; // Start at (0, 0)
    var tween = new TWEEN.Tween(coords) // Create a new tween that modifies 'coords'.
    tween.to({ y: 60, x: 10 }, 2500) // Move to (300, 200) in 1 second.
    tween.easing(TWEEN.Easing.Elastic.Out);
    tween.delay(500);
    tween.start(); // Start the tween immediately.
    tween.onUpdate(function(object) {
      var newHeight = coords.y;
      camera.position.y = coords.y;
    });

  };

  // Load a glTF resource
  loader.load('models/QUT_Diagram_01.glb', function ( gltf ) {
      model = gltf.scene;
      clips = gltf.animations;
      scene.add( model );
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Scene
      gltf.asset; // Object
      console.log(gltf.scene);

      gltf.scene.traverse(function(object) {

        if (object instanceof THREE.Mesh){
          object.material.envMap = envMap;
          object.material.envMapIntensity = 0.1;
        };

        if (object instanceof THREE.Mesh && object.name !='Green') {
          object.castShadow = "true";
          object.receiveShadow = "true"
          object.material.clippingPlanes = [globalPlane];
          object.material.clipShadows = true; 
          console.log("captured");
        };

        if (object instanceof THREE.Mesh && object.name =='Green') {
          object.castShadow = "false";
          object.receiveShadow = "false";
          object.material.transparent = "false";
        };

        if (object instanceof THREE.Mesh && object.name =='Trees') {
          object.material.transparent = "true";
          object.material.clippingPlanes = [globalPlane2];
          object.material.clipShadows = true;
          object.material.opacity = 0.2;
        };
      });

      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).setLoop( THREE.LoopPingPong, 2 );
        mixer.clipAction(clip).play();
        clips.push(clip);
      });
    },

    function ( xhr ) {
      if ( xhr.lengthComputable ) {
        // var percentComplete = xhr.loaded / xhr.total * 100;
        // console.log( Math.round(percentComplete, 2) + '%' );
        // var percentComplete = xhr.loaded / xhr.total * 100;  
        // document.getElementById("percentComplete").innerHTML=(Math.ceil( percentComplete ) + "%" );
      };
    },
    function ( error ) {
      console.log( 'An error happened'+ error );
    }
  );
  
  //LIGHT//////////////////////////////////
  ambientlight = new THREE.AmbientLight( 0x080808, 10 ); 
  dirLight = new THREE.DirectionalLight( 0xFCF8E4, 1 );
  dirLight.shadow.camera.right =  200;
  dirLight.shadow.camera.left = -200;
  dirLight.shadow.camera.top =  200;
  dirLight.shadow.camera.bottom = -200;
  dirLight.position.y = (sunData[TOD].sunPosition.Y);
  dirLight.position.x = (sunData[TOD].sunPosition.X);
  dirLight.position.z = -(sunData[TOD].sunPosition.Z);
  dirLight.rotation.y = Math.PI / 18;
  dirLight.shadow.mapSize.width = 2048 * 1;
  dirLight.shadow.mapSize.height = 2048 * 1;
  dirLight.shadow.camera.near = 0;
  dirLight.shadow.camera.far = 1500;
  dirLight.bias = 0.0001;
  dirLight.castShadow = true;
  scene.add(dirLight.target);
  scene.add(dirLight);
  scene.add(ambientlight);
  
  //RENDERERS////////////////////////////////
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.shadowMap.enabled = true;
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;
  // renderer.setClearColor( 0xfdf7e8, 1);
  renderer.domElement.style.zIndex = 2;
  setPixelRatio();
  container = document.getElementById('container');
  renderer.setSize($(container).width(), $(container).height());
  container.appendChild(renderer.domElement);

  //CONTROLS////////////////////////////////
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.target = new THREE.Vector3(0, camTarget.y, 0);
  controls.update();

};

//////FUNCTIONS////////////////////////////

function animate(){

  var time2 = Date.now() * 0.002;
  scene.getObjectByName( "Trees" ).position.y = (Math.sin(time2*2))/3;
  // scene.getObjectByName( "OLD_TOPO_BIRDS" ).position.y = (Math.sin(time2*7))/4;

  // dirLight.position.y = (sunData[ TOD ].sunPosition.Y);
  // dirLight.position.x = (sunData[ TOD ].sunPosition.X);
  // dirLight.position.z = -(sunData[ TOD ].sunPosition.Z);

  // var slider = document.getElementById("myRange");
  // var slider2 = document.getElementById("myRange2");
  
  // slider.oninput = function() {
  //   // globalPlane3.position.x = this.value;
  //   globalPlane3.constant = 60 - parseFloat(this.value);
  // };
  // slider2.oninput = function() {
  //   // globalPlane3.position.x = this.value;
  //   globalPlane.constant = 100 - parseFloat(this.value);
  // };

  TWEEN.update();

  camera.updateProjectionMatrix();
  controls.update();

  var delta = 0.65 * clock.getDelta();
  mixer.update(delta);

  renderer.render(scene, camera);
  window.requestAnimationFrame( animate );

}; 



function mixerPlay(event){
  
  clipCount += 1;

  if (clipCount == 1){
    clips.forEach((clip) => {
      mixer.clipAction(clip).timeScale = 1;
      mixer.clipAction(clip).clampWhenFinished = true;
    })
  } else {
    clips.forEach((clip) => {
      mixer.clipAction(clip).reset();
      mixer.clipAction(clip).clampWhenFinished = true;
    })
  }

  clips.forEach((clip) => {
    mixer.clipAction(clip).timeScale = 1;
    mixer.clipAction(clip).clampWhenFinished = true;
  });

  console.log(clipCount);


  // var vals = { y: 1, x: 0.3 }; // Start at (0, 0)
  // var tweenLightOn = new TWEEN.Tween(vals) // Create a new tween that modifies 'vals'.
  // tweenLightOn.to({ y: 10, x: 1 }, 2500) // Move to (300, 200) in 1 second.
  // tweenLightOn.easing(TWEEN.Easing.Quadratic.InOut);
  // tweenLightOn.delay(500);
  // tweenLightOn.start(); // Start the tween immediately.
  // tweenLightOn.onUpdate(function(object) {
  //   ambientlight.intensity = vals.y;
  //   dirLight.intensity = vals.x;
  //   TOD = vals.x;
  // });

//   $("#heading").delay(2000).fadeOut(function() {
//     $(this).text("Insert Second Header Statement About Diagram");
//   }).fadeIn(5000);
};

// function onDocumentMouseMove(event) {
//     mouseX = ( event.clientX - windowHalfX ) * 0.005;
//     mouseY = ( event.clientY - windowHalfY ) * 0.005;
// };

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};

function setPixelRatio(){
  if (window.devicePixelRatio > 2){
    renderer.setPixelRatio( window.devicePixelRatio / 2 );
  } else {
    renderer.setPixelRatio( window.devicePixelRatio );
  }
};

function onWindowResize() {
  container = document.getElementById('container');
  var aspect = $(container).width() / $(container).height();
  camera.aspect = aspect;
  camera.left   = - frustumSize * aspect / 2;
  camera.right  =   frustumSize * aspect / 2;
  camera.top    =   frustumSize / 2;
  camera.bottom = - frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize($(container).width(), $(container).height());
};

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
};

document.addEventListener("keypress", function(e) {
  if (e.keyCode === 13) {
    toggleFullScreen();
    console.log("triggered");
  }
}, false);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
  }
}