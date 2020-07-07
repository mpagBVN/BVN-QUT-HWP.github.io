/////////Global Variables///////////
var camera, scene, renderer, rectangle, div, controls, manager, mixer, composer, dirLight, tween, coords, ambientlight;
var clock = new THREE.Clock();
camTarget = new THREE.Vector3(0,20,0);
var clips = [];
var clipCount = 0;
var TOD = 13;
var globalPlane;
/////////Events/////////////////////
window.addEventListener( 'resize', onWindowResize, false );
Hammer(document.getElementById('container')).on("doubletap", mixerPlay);
mobileUI();

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
  camera.position.z = -20;
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
  globalPlane2 = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 150);
  globalPlane3 = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 53.23);

  var geometryPlane = new THREE.PlaneGeometry(1000,1000);
  var groundMaterial = new THREE.ShadowMaterial();
  groundMaterial.opacity = 0.1;
  var ground = new THREE.Mesh(geometryPlane, groundMaterial);
  ground.rotateX( - Math.PI / 2 );
  ground.position.y = -30;
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

    // console.log("fired");
   
    // $(".loader").css('visibility', 'hidden') 
    // $("#flexContainer").css('visibility', 'visible');

    clips.forEach((clip) => {
      mixer.clipAction(clip).timeScale = 0;
    });

    animate();

    var coords = { y: 200 }; // Start at (0, 0)
    var tween = new TWEEN.Tween(coords) // Create a new tween that modifies 'coords'.
    tween.to({ y: 40 }, 2500) // Move to (300, 200) in 1 second.
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

      gltf.scene.traverse(function(object) {

        if (object instanceof THREE.Mesh){
          object.material.envMap = envMap;
          object.material.envMapIntensity = 0.5;
          object.castShadow = "true";
          object.receiveShadow = "true"
        };

        if (object instanceof THREE.Mesh && object.name =='LayerB001') {
          object.castShadow = "true";
          object.receiveShadow = "true"
          object.material.clippingPlanes = [globalPlane];
          object.material.clipShadows = true; 
        };

        if (object instanceof THREE.Mesh && (object.material.name =='Default OBJ.001')) {
          object.castShadow = "true";
          object.receiveShadow = "true"
          object.material.clippingPlanes = [globalPlane3];
          object.material.clipShadows = true; 
        };

        if (object instanceof THREE.Mesh && object.name =='Trees002') {
          object.material.transparent = "true";
          object.material.clippingPlanes = [globalPlane2];
          object.material.clipShadows = true;
          object.material.opacity = 0.2;
        };

        if (object instanceof THREE.Mesh && object.name =='LayerD') {
          object.material.clippingPlanes = [globalPlane2];
          object.material.clipShadows = true;
          object.material.side = THREE.DoubleSide;
          object.material.opacity = 0.8;
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
  scene.getObjectByName( "Trees002" ).position.y = (Math.sin(time2*2))/3;
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
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function mobileUI(){
  if (isMobileDevice() == true){
    console.log('mobile client');
  } else {
    document.getElementById('right-half').style.display = 'flex';
    document.getElementById('footer').style.display = 'none';
    console.log('desktop client');
  }
};

document.addEventListener("keypress", function(e) {
  if (e.keyCode === 13) {
    toggleFullScreen();
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