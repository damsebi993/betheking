import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';
import { GLTFLoader } from 'GLTFLoader';
import { FontLoader } from 'FontLoader';
import { TextGeometry } from 'TextGeometry';

let backendUrl = undefined;
let connection = new TikTokIOConnection("https://tiktok-chat-reader.zerody.one/");

$(document).ready(() => {
    connect();
})

function connect() {
    let urlParams = new URLSearchParams(window.location.search);
    let uniqueId ="usuario"
    if (uniqueId !== '') {

        console.log('Connecting...');

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {

            

        }).catch(errorMessage => {
            console.log(errorMessage);
        })

    } else {
        alert('no username entered');
    }
}

var users = [];
var cooldown = 10 * 1000;
var followCooldown = 10 * 1000;
var shareCooldown = 2 * 1000;
var likeCooldown = 7 * 1000;
var chatCooldown = 2 * 1000;

connection.on('follow', function(data) {
    if (users[data.uniqueId] == null) {
        users[data.uniqueId] = { likecd: null, sharecd: null, emojicd: null, followcd: null, chatCooldown: null}
    } 
    let d = new Date();
    if (users[data.uniqueId].followcd != null) {
        if (Math.abs(users[data.uniqueId].followcd - d) >= followCooldown) {
            spawnFollow(data.uniqueId, data.profilePictureUrl);
            users[data.uniqueId].followcd = d;
        }
    } else {
        spawnLike(data.uniqueId, data.profilePictureUrl);
        users[data.uniqueId].followcd = d;
    }
});

connection.on('like', function(data) {
    if (users[data.uniqueId] == null) {
        users[data.uniqueId] = { likecd: null, sharecd: null, emojicd: null, followcd: null, chatCooldown: null}
    } 
    let d = new Date();
    if (users[data.uniqueId].likecd != null) {
        if (Math.abs(users[data.uniqueId].likecd - d) >= likeCooldown) {
            spawnLike(data.uniqueId, data.profilePictureUrl);
            users[data.uniqueId].likecd = d;
        }
    } else {
        spawnLike(data.uniqueId, data.profilePictureUrl);
        users[data.uniqueId].likecd = d;
    }
});

connection.on('gift', function(data) {
    console.log(data.diamondCount, data.repeatCount)
    //spawnVIP(data.uniqueId, data.profilePictureUrl);
    if (data.giftType === 1 && data.repeatEnd)
    {
        for (let i = 0; i < data.diamondCount*data.repeatCount; i++) {
            setTimeout(() => {
                console.log("i:", i, "dC:", data.diamondCount, "rC:", data.repeatCount)
                spawnVIP(data.uniqueId, data.profilePictureUrl);
            }, i*250);
        }
    }
    else
    {
        for (let i = 0; i < data.diamondCount; i++) {
            setTimeout(() => {
                console.log("i:", i, "dC:", data.diamondCount, "rC:", data.repeatCount)
                spawnVIP(data.uniqueId, data.profilePictureUrl);
            }, i*250);
        }
    }
});

connection.on('social', function(data) {
    if (users[data.uniqueId] == null) {
        users[data.uniqueId] = { likecd: null, sharecd: null, emojicd: null, followcd: null, chatCooldown: null}
    } 
    let d = new Date();
    if (users[data.uniqueId].sharecd != null) {
        if (Math.abs(users[data.uniqueId].sharecd - d) >= shareCooldown) {
            spawnChat(data.uniqueId, data.profilePictureUrl);
            users[data.uniqueId].sharecd = d;
        }
    } else {
        spawnChat(data.uniqueId, data.profilePictureUrl);
        users[data.uniqueId].sharecd = d;
    }
});


connection.on('emoji', function(data) {
    console.log("Emoji called")
    if (users[data.uniqueId] == null) {
        users[data.uniqueId] = { likecd: null, sharecd: null, emojicd: null, followcd: null, chatCooldown: null}
    } 
    let d = new Date();
    if (users[data.uniqueId].emojicd != null) {
        if (Math.abs(users[data.uniqueId].emojicd - d) >= chatCooldown) {
            spawnLike(data.uniqueId, data.profilePictureUrl);
            users[data.uniqueId].emojicd = d;
        }
    } else {
        spawnLike(data.uniqueId, data.profilePictureUrl);
        users[data.uniqueId].emojicd = d;
    }
});

connection.on('chat', function(data) {
    if (users[data.uniqueId] == null) {
        users[data.uniqueId] = { likecd: null, sharecd: null, emojicd: null, followcd: null, chatCooldown: null}
    } 
    let d = new Date();
    if (users[data.uniqueId].chatCooldown != null) {
        if (Math.abs(users[data.uniqueId].chatCooldown - d) >= chatCooldown) {
            spawnChat(data.uniqueId, data.profilePictureUrl);
            users[data.uniqueId].chatCooldown = d;
        }
    } else {
        spawnChat(data.uniqueId, data.profilePictureUrl);
        users[data.uniqueId].chatCooldown = d;
    }
});

connection.on('streamEnd', () => {
    document.getElementById("connectButton").style.backgroundColor = "grey";
    document.getElementById("connectButton").innerHTML = `Stream ended`;
})

const scene = new THREE.Scene();

const width = 1080;
const height = 1200;

const clock = new THREE.Clock();

var heartMat = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("img/heart.png"), transparent: true });

var players = [];
window.players = players;

const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 4000 );
window.camera = camera;
camera.rotation.x = 0.9;

var king;
var enemies = [];

camera.position.set(0, -1000, 1000);

const renderer = new THREE.WebGLRenderer( { alpha: true, antialias: true } );
renderer.setSize( width, height );
renderer.setClearColor( 0x000000, 0 );
renderer.shadowMap.enabled = true;
renderer.domElement.id = 'canvas';
renderer.autoClear = false;
//const controls = new OrbitControls( camera, renderer.domElement );
document.getElementById("canvasContainer").appendChild( renderer.domElement );

const floader = new FontLoader();
var vipText;
var followText;

const geometry2 = new THREE.PlaneGeometry( width, height );
//const material2 = new THREE.MeshPhongMaterial( { color: "grey" } );
const material2 = new THREE.ShadowMaterial( );
material2.opacity = 0.2;
const plane = new THREE.Mesh( geometry2, material2 );
plane.receiveShadow = true;
plane.position.set(0, 0, 0);
scene.add( plane );

const material3 = new THREE.MeshStandardMaterial( { color: 0x4D88C9, roughness:1, metalness:0.7 } );

var r1 = Math.PI / 2;
var r2 = Math.PI / 2 * 2;
var r3 = Math.PI / 2 * 3;
var r4 = Math.PI / 2 * 4;
var scale = 50;
var list = [{x: -500, y: -600, model: "models/floor.gltf"}, 
{x: -400, y: -600, model: "models/floor.gltf"},
{x: -300, y: -600, model: "models/floor.gltf"},
{x: -200, y: -600, model: "models/floor.gltf"},
{x: -100, y: -600, model: "models/floor.gltf"},
{x: 0, y: -600, model: "models/floor.gltf"},
{x: 100, y: -600, model: "models/floor.gltf"},
{x: 200, y: -600, model: "models/floor.gltf"},
{x: 300, y: -600, model: "models/floor_round.gltf", r: r4 },
{x: 300, y: -500, model: "models/floor.gltf"},
{x: 300, y: -400, model: "models/floor_round.gltf", r: r1 },
{x: 200, y: -400, model: "models/floor.gltf"},
{x: 100, y: -400, model: "models/floor.gltf"},
{x: 0, y: -400, model: "models/floor.gltf"},
{x: -100, y: -400, model: "models/floor.gltf"},
{x: -200, y: -400, model: "models/floor.gltf"},
{x: -300, y: -400, model: "models/floor_round.gltf", r: r3 },
{x: -300, y: -300, model: "models/floor.gltf"},
{x: -300, y: -200, model: "models/floor_round.gltf", r: r2 },
{x: -200, y: -200, model: "models/floor.gltf"},
{x: -100, y: -200, model: "models/floor.gltf"},
{x: 0, y: -200, model: "models/floor.gltf"},
{x: 100, y: -200, model: "models/floor.gltf"},
{x: 200, y: -200, model: "models/floor.gltf"},
{x: 300, y: -200, model: "models/floor_round.gltf", r: r4 },
{x: 300, y: -100, model: "models/floor.gltf"},
{x: 300, y: 0, model: "models/floor_round.gltf", r: r1 },
{x: 200, y: 0, model: "models/floor.gltf"},
{x: 100, y: 0, model: "models/floor.gltf"},
{x: 0, y: 0, model: "models/floor.gltf"},
{x: -100, y: 0, model: "models/floor.gltf"},
{x: -200, y: 0, model: "models/floor.gltf"},
{x: -300, y: 0, model: "models/floor_round.gltf", r: r3 },
{x: -300, y: 100, model: "models/floor.gltf"},
{x: -300, y: 200, model: "models/floor_round.gltf", r: r2 },
{x: -200, y: 200, model: "models/floor.gltf"},
{x: -100, y: 200, model: "models/floor.gltf"},
{x: 0, y: 200, model: "models/floor_round.gltf", r: r4 },
{x: 0, y: 300, model: "models/floor.gltf"},
{x: 0, y: 400, model: "models/floor.gltf"},
]
list.forEach(element => {
    var loader = new GLTFLoader();
    loader.load(
    element.model,
    function ( gltf ) {
            if (element.r != undefined) {
                gltf.scene.rotation.set( Math.PI / 2 , element.r, 0 );
            } else {
                gltf.scene.rotation.set( Math.PI / 2 , 0, 0 );
            }
            gltf.scene.position.set( element.x , element.y, -20 );
            gltf.scene.scale.set( scale , scale, scale );
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = material3;
                }
            })
            scene.add( gltf.scene );
    },
    );
});

var loader = new GLTFLoader();
    loader.load(
    "models/king.glb",
    function ( gltf ) {
            gltf.scene.rotation.set( Math.PI / 2 , Math.PI , 0 );
            gltf.scene.position.set( 0 , 600, 0 );
            gltf.scene.scale.set( 40 , 40 , 40 );
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                }
            })
            scene.add( gltf.scene );
            let mixer = new THREE.AnimationMixer(gltf.scene)
            gltf.animations.forEach( ( clip ) => {
                if (clip.name == "ArmatureAction") {
                    mixer.clipAction( clip ).play();
                    king = ({ name: "king", body: gltf.scene, mixer: mixer, clip: clip });
                }               
              
            } );
    },
);

loader = new GLTFLoader();
    loader.load(
    "models/archer_blue.glb",
    function ( gltf ) {
            gltf.scene.rotation.set( Math.PI / 2 , 0 , 0 );
            window.rotation = gltf.scene.rotation;
            gltf.scene.position.set( -200 , 100, 0 );
            gltf.scene.scale.set( 25 , 25 , 25 );
            gltf.scene.up.set(1,0,0);
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                }
            })
            scene.add( gltf.scene );
            let mixer = new THREE.AnimationMixer(gltf.scene)
            mixer.addEventListener('finished', function() {
                shoot("archer_blue")
            });
            gltf.animations.forEach( ( clip ) => {
                if (clip.name == "Armature.001Action.001") {
                    let caction = mixer.clipAction(clip);
                    caction.timeScale = 5;
                    caction.loop = THREE.LoopOnce;
                    enemies.push({ name: "archer_blue", body: gltf.scene, mixer: mixer, clip: caction, attacking: false, fixed: null });
                }               
              
            } );
    },
);

loader = new GLTFLoader();
    loader.load(
    "models/archer_red.glb",
    function ( gltf ) {
            gltf.scene.rotation.set( Math.PI / 2 , 0 , 0 );
            gltf.scene.position.set( -200 , -300, 0 );
            gltf.scene.scale.set( 25 , 25 , 25 );
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                }
            })
            scene.add( gltf.scene );
            let mixer = new THREE.AnimationMixer(gltf.scene)
            mixer.addEventListener('finished', function() {
                shoot("archer_red")
            });
            gltf.animations.forEach( ( clip ) => {
                if (clip.name == "Armature.001Action.002") {
                    let caction = mixer.clipAction(clip);
                    caction.timeScale = 3;
                    caction.loop = THREE.LoopOnce;
                    enemies.push({ name: "archer_red", body: gltf.scene, mixer: mixer, clip: caction, attacking: false, fixed: null });
                }               
              
            } );
    },
);

loader = new GLTFLoader();
    loader.load(
    "models/archer_green.glb",
    function ( gltf ) {
            gltf.scene.rotation.set( Math.PI / 2 , 0 , 0 );
            gltf.scene.position.set( 200 , -500, 0 );
            gltf.scene.scale.set( 25 , 25 , 25 );
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                }
            })
            scene.add( gltf.scene );
            let mixer = new THREE.AnimationMixer(gltf.scene)
            mixer.addEventListener('finished', function() {
                shoot("archer_green");
            });
            gltf.animations.forEach( ( clip ) => {
                if (clip.name == "Armature.001Action.003") {
                    let caction = mixer.clipAction(clip);
                    caction.timeScale = 2;
                    caction.loop = THREE.LoopOnce;
                    enemies.push({ name: "archer_green", body: gltf.scene, mixer: mixer, clip: caction, attacking: false, fixed: null });
                }               
              
            } );
    },
);

loader = new GLTFLoader();
    loader.load(
    "models/archer_yellow.glb",
    function ( gltf ) {
            gltf.scene.rotation.set( Math.PI / 2 , 0 , 0 );
            gltf.scene.position.set( 200 , -100, 0 );
            gltf.scene.scale.set( 25 , 25 , 25 );
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                }
            })
            scene.add( gltf.scene );
            let mixer = new THREE.AnimationMixer(gltf.scene)
            mixer.addEventListener('finished', function() {
                shoot("archer_yellow")
            });
            gltf.animations.forEach( ( clip ) => {
                if (clip.name == "Armature.001Action.004") {
                    let caction = mixer.clipAction(clip);
                    caction.timeScale = 4;
                    caction.loop = THREE.LoopOnce;
                    enemies.push({ name: "archer_yellow", body: gltf.scene, mixer: mixer, clip: caction, attacking: false, fixed: null });
                }               
              
            } );
    },
);

function shoot(name) {
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].name == name) {
            enemies[i].fixed.hp--;
            if (enemies[i].fixed.hp <= 0) {
                removePlayer(enemies[i].fixed);
            }
            enemies[i].clip.stop();
            enemies[i].attacking = false;
            enemies[i].fixed = null;
            break;
        }
    }
}

floader.load( 'fonts/Futura-Bold_Regular.json', function ( font ) {
    vipText = new TextGeometry( 'VIP', {
        font: font,
        size: 40,
        height: 5,
        curveSegments: 32
    });
    followText = new TextGeometry( 'Follow', {
        font: font,
        size: 20,
        height: 5,
        curveSegments: 32
    } );
});

export function spawnVIP(name, pic) {
    console.log("Spawn " + name + " (VIP)")
    if (vipText != null && followText != null) {
        var id = getId();
        players.push({ id: id, name: name, pic: pic, hp: 1, speed: 1, circle: addCircle(pic, 8, 0xEAC635, 3, -550, -600-rng(1,35))});
    }
}

export function spawnFollow(name, pic) {
    console.log("Spawn " + name + " (Follow)")
    if (vipText != null && followText != null) {
        var id = getId();
        players.push({ id: id, name: name, pic: pic, hp: 1, speed: 1, circle: addCircle(pic, 6, 0x007F00, 1, -550, -600-rng(1,35))});
    }
}

export function spawnLike(name, pic) {
    console.log("Spawn " + name + " (Like)")
    if (vipText != null && followText != null) {
        var id = getId();
        players.push({ id: id, name: name, pic: pic, hp: 1, speed: 0.5, circle: addCircle(pic, 5, 0xE84CB4, 2, -550, -600-rng(1,35))});
    }
}

export function spawnChat(name, pic) {
    console.log("Spawn " + name + " (Chat)")
    if (vipText != null && followText != null) {
        var id = getId();
        players.push({ id: id, name: name, pic: pic, hp: 1, speed: 0.5, circle: addCircle(pic, 5, 0xFFFFFF, 4, -550, -600-rng(1,35))});
    }
}

export function forceKing(name, pic) {
    console.log("Spawn " + name + " (Forceking)")
    if (vipText != null && followText != null) {
        var id = getId();
        players.push({ id: id, name: name, pic: pic, hp: 999, speed: 10, circle: addCircle(pic, 8, 0xEAC635, 3, -550, -600-rng(1,35))});
    }
}

var count = 0;

function getId() {
    count++;
    return count;
}



function addCircle(img, size, borderColor, type, x, y) {

    let circlePic = null, circleBorder = null, circleTop = null;

    let textureLoader = new THREE.TextureLoader();
    let texture1 = textureLoader.load(img);
    let circleGeom = new THREE.CircleGeometry(size, 64);
    let circleMat = new THREE.MeshBasicMaterial({
        map: texture1,
        side: THREE.DoubleSide
    });
    let circleMesh = new THREE.Mesh(circleGeom, circleMat);
    circleMesh.scale.set( 5 , 5 , 1 );
    circleMesh.position.set( x , y-15 , 50 );
    circleMesh.rotation.x = 0.9;
    scene.add(circleMesh);
    circlePic = circleMesh;
    
    if (borderColor != null) {
        let circleGeom2 = new THREE.CircleGeometry(size, 64);
        let circleMat2 = new THREE.MeshBasicMaterial({
            color: borderColor
        });
        let circleMesh2 = new THREE.Mesh(circleGeom2, circleMat2);
        circleMesh2.scale.set( 5.5 , 5.5 , 1 );
        circleMesh2.position.set( x , y-15 , 49 );
        circleMesh2.rotation.x = 0.9;
        scene.add(circleMesh2);
        circleBorder = circleMesh2;
    }
    switch (type) {
        case 1:
            var textMaterial = new THREE.MeshBasicMaterial({ color: "white" });
            var text = new THREE.Mesh(followText , textMaterial);
            text.scale.set( 1 , 1 , 1 );
            text.position.set( x-38 , y , 70 );
            text.rotation.x = 0.9;
            scene.add(text);
            circleTop = text;
            break;
        case 2:
            var plane1 = new THREE.PlaneGeometry( 30, 30 );
            const plane5 = new THREE.Mesh( plane1, heartMat );
            plane5.position.set(x, y, 70);
            plane5.rotation.x = 0.9;
            scene.add( plane5 );
            circleTop = plane5;
            break;
        case 3:
            var textMaterial = new THREE.MeshBasicMaterial({ color: "white" });
            var text = new THREE.Mesh(vipText , textMaterial);
            text.scale.set( 1 , 1 , 1 );
            text.position.set( x-45 , y , 70 );
            text.rotation.x = 0.9;
            scene.add(text);
            circleTop = text;
        break;
        case 4:
            var textMaterial = new THREE.MeshBasicMaterial({ color: "white" });
            var text = new THREE.Mesh(vipText , textMaterial);
            text.scale.set( 1 , 1 , 1 );
            text.position.set( x-45 , y , 70 );
            text.rotation.x = 0.9;
            circleTop = text;
        default:
            break;
    }
    return { circlePic: circlePic, circleBorder: circleBorder, circleTop: circleTop };
}

const light = new THREE.DirectionalLight( 0x404040, 4 );
light.position.set(-300, 500, 750);
light.shadow.camera.right = 500;
light.shadow.camera.left = -500;
light.shadow.camera.top = 1000;
light.shadow.camera.bottom = -1000;
light.shadow.camera.far = 2000;
light.shadow.mapSize.width = 8192;
light.shadow.mapSize.height = 8192;
light.castShadow = true;
//const helper = new THREE.CameraHelper(light.shadow.camera)
//scene.add(helper)
//const helper2 = new THREE.CameraHelper(camera)
//scene.add(helper2)
//const helper3 = new THREE.CameraHelper(camera2)
//scene.add(helper3)
scene.add( new THREE.PointLightHelper( light, 200 ) )
scene.add( light );
const light2 = new THREE.AmbientLight( 0xFFFFFF, 2 );
light2.position.set(0, 0, 100);
scene.add( light2 );

function animate() {
    requestAnimationFrame( animate );

    var delta = clock.getDelta();
    if (king != undefined && king.mixer) {
        king.mixer.update(delta);
    }
    enemies.forEach(enemy => {
        if (enemy.mixer) {
            enemy.mixer.update(delta);
        }
        if (enemy.fixed != null) {
            enemy.body.lookAt(enemy.fixed.circle.circlePic.position.x, enemy.fixed.circle.circlePic.position.y, enemy.body.position.z);
            if (enemy.body.rotation.x <= 0) {
                enemy.body.rotation.y = Math.PI - enemy.body.rotation.y;
            }
            enemy.body.rotation.x = Math.PI / 2;
            enemy.body.rotation.z = 0;
        }
    });

    players.forEach(player => {
        if (player.circle.circlePic.position.x < 300 && player.circle.circlePic.position.y < -500) {
            player.circle.circlePic.position.x+=player.speed;
            player.circle.circleBorder.position.x+=player.speed;
            player.circle.circleTop.position.x+=player.speed;
        } else if (player.circle.circlePic.position.y < -450) {
            player.circle.circlePic.position.y+=player.speed;
            player.circle.circleBorder.position.y+=player.speed;
            player.circle.circleTop.position.y+=player.speed;
        } else if (player.circle.circlePic.position.x > -300 && player.circle.circlePic.position.y <= -445) {
            player.circle.circlePic.position.x+=-player.speed;
            player.circle.circleBorder.position.x+=-player.speed;
            player.circle.circleTop.position.x+=-player.speed;
        } else if (player.circle.circlePic.position.y < -250) {
            player.circle.circlePic.position.y+=player.speed;
            player.circle.circleBorder.position.y+=player.speed;
            player.circle.circleTop.position.y+=player.speed;
        } else if (player.circle.circlePic.position.x < 300 && player.circle.circlePic.position.y <= -250) {
            player.circle.circlePic.position.x+=player.speed;
            player.circle.circleBorder.position.x+=player.speed;
            player.circle.circleTop.position.x+=player.speed;
        } else if (player.circle.circlePic.position.y < -50) {
            player.circle.circlePic.position.y+=player.speed;
            player.circle.circleBorder.position.y+=player.speed;
            player.circle.circleTop.position.y+=player.speed;
        } else if (player.circle.circlePic.position.x > -300 && player.circle.circlePic.position.y <= -50) {
            player.circle.circlePic.position.x+=-player.speed;
            player.circle.circleBorder.position.x+=-player.speed;
            player.circle.circleTop.position.x+=-player.speed;
        } else if (player.circle.circlePic.position.y < 20) {
            player.circle.circlePic.position.y+=player.speed;
            player.circle.circleBorder.position.y+=player.speed;
            player.circle.circleTop.position.y+=player.speed;
        }  else if (player.circle.circlePic.position.x < 0 && player.circle.circlePic.position.y >= 150) {
            player.circle.circlePic.position.x+=player.speed;
            player.circle.circleBorder.position.x+=player.speed;
            player.circle.circleTop.position.x+=player.speed;
        }  else if (player.circle.circlePic.position.y < 500) {
            player.circle.circlePic.position.y+=player.speed;
            player.circle.circleBorder.position.y+=player.speed;
            player.circle.circleTop.position.y+=player.speed;
        }  else if (player.circle.circlePic.position.y >= 500) {
            convertKing(player);
        }
    });

    renderer.clear();
    renderer.render( scene, camera );
};

function convertKing(player) {
    document.getElementById("userText").innerHTML = player.name;
    document.getElementById("kingImage").src = player.pic;
    document.getElementById("kingImage").style.opacity = 1;
    document.getElementById("kingImageCrown").style.opacity = 1;
    removePlayer(player);
}

function removePlayer(player) {
    scene.remove(player.circle.circlePic);
    scene.remove(player.circle.circleBorder);
    if (player.circle.circleTop != null) {
        scene.remove(player.circle.circleTop);
    }
    let index = players.findIndex(object => {
        return object.id === player.id;
    });
    if (index != -1) {
        players.splice(index, 1);
    }
}

animate();

setInterval(() => {
    enemies.forEach(enemy => {
        if (enemy.attacking === false) {
            if (enemy.name == "archer_blue") {
                for (let i = 0; i < players.length; i++) {
                    if (players[i].circle.circlePic.position.x <= -50 && players[i].circle.circlePic.position.x >= -400 && players[i].circle.circlePic.position.y <= 200 && players[i].circle.circlePic.position.y >= -100) {
                        if (enemy.attacking === false) {
                            enemy.fixed = players[i];
                            enemy.attacking = true;
                            enemy.clip.play();
                        }
                        break;
                    }
                }
            } else if (enemy.name == "archer_red") {
                for (let i = 0; i < players.length; i++) {
                    if (players[i].circle.circlePic.position.x <= -50 && players[i].circle.circlePic.position.x >= -400 && players[i].circle.circlePic.position.y <= -200 && players[i].circle.circlePic.position.y >= -600) {
                        if (enemy.attacking === false) {
                            enemy.fixed = players[i];
                            enemy.attacking = true;
                            enemy.clip.play();
                        }
                        break;
                    }
                }
            } else if (enemy.name == "archer_green") {
                for (let i = 0; i < players.length; i++) {
                    if (players[i].circle.circlePic.position.x <= 350 && players[i].circle.circlePic.position.x >= 0 && players[i].circle.circlePic.position.y <= -400 && players[i].circle.circlePic.position.y >= -800) {
                        if (enemy.attacking === false) {
                            enemy.fixed = players[i];
                            enemy.attacking = true;
                            enemy.clip.play();
                        }
                        break;
                    }
                }
            } else if (enemy.name == "archer_yellow") {
                for (let i = 0; i < players.length; i++) {
                    if (players[i].circle.circlePic.position.x <= 350 && players[i].circle.circlePic.position.x >= 0 && players[i].circle.circlePic.position.y <= 0 && players[i].circle.circlePic.position.y >= -400) {
                        if (enemy.attacking === false) {
                            enemy.fixed = players[i];
                            enemy.attacking = true;
                            enemy.clip.play();
                        }
                        break;
                    }
                }
            }
        }
    });
}, 1000);

function rng(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}