import './styles/style.css';
import {
  Position,
  PressedKeys,
  Size,
  Values,
  Velocity,
  InitialPlayerProperties,
  IPlayer,
} from './models';
import { getRandomInt, createImage, sleep, runPolyfill } from './utils';
import platformImage from './assets/platform.png';
import background from './assets/background.png';
import floor from './assets/floor.png';

const playerImgRight = createImage(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/160783/boy1.png',
  shouldInitGame
);
const playerImgLeft = createImage(
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/160783/boy2.png',
  shouldInitGame
);
const backgroundImage = createImage(background, shouldInitGame);
const floorImage = createImage(floor, shouldInitGame);

let numOfLoadedImages = 0;
let requestAnimationId = 0;

runPolyfill();
const canvas = document.querySelector('canvas');
const c = canvas?.getContext('2d');
document.querySelector('.game-over .btn')?.addEventListener('click', onRestart);

class Game {
  private velocityXDiff: number = Values.X_DIFF;
  private velocityYDiff: number = Values.Y_DIFF;
  readonly gravity: number = 1;
  jumpsCounter: number = 0;
  player: IPlayer;
  velocity: Velocity = {
    x: 0,
    y: 10,
  };
  keys: PressedKeys = {
    right: { isPressed: false },
    left: { isPressed: false },
  };
  platforms: GenericObject[] = [];
  genericObjects: GenericObject[] = [];
  floors: GenericObject[] = [];
  numberOfFramesToIncreaseDistance = 0;
  lastDistanceToIncreaseSpeed = 0;
  distance = 0;
  numberOfFramesToMovePlayerImage = 0;
  platformMovementXDiff = 5;
  floorMovementXDiff = 5;

  constructor(player: IPlayer) {
    this.player = player;
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
    this.initObjects();
    this.animate();
  }

  get bothKeysPressed() {
    return this.keys.right.isPressed && this.keys.left.isPressed;
  }

  get isLeftOrRightPressed() {
    return this.keys.right.isPressed || this.keys.left.isPressed;
  }

  get canGoLeft() {
    return (
      this.keys.left.isPressed &&
      !this.bothKeysPressed &&
      this.player.position.x > 100
    );
  }

  get canGoRight() {
    return (
      canvas &&
      !this.bothKeysPressed &&
      this.keys.right.isPressed &&
      this.player.position.x < canvas.width - 200
    );
  }

  get isOnFloor() {
    return canvas && this.floors.some(this.checkIsOnObject.bind(this));
  }

  get isOnPlatform() {
    return this.platforms.some(this.checkIsOnObject.bind(this));
  }

  initObjects() {
    if (canvas) {
      this.platforms = this.getPlatforms() || [];

      this.genericObjects[0] = new GenericObject(
        { x: -1, y: -1 },
        { height: canvas.height, width: canvas.width },
        backgroundImage
      );
      this.floors = this.createFloors() || [];
    }
  }

  createFloors(prevX = 0) {
    const img = floorImage;
    return (
      canvas &&
      Array(5)
        .fill('')
        .map(() => {
          const widthOfFloor = getRandomInt(250, 450);
          const platform = new GenericObject(
            {
              x: prevX,
              y: canvas.height - 80,
            },
            {
              width: widthOfFloor,
              height: 80,
            },
            img
          );
          prevX += widthOfFloor + getRandomInt(120, 350);
          return platform;
        })
    );
  }

  //main function , control the flow
  animate() {
    requestAnimationId = requestAnimationFrame(this.animate.bind(this));
    canvas && c && c.clearRect(0, 0, canvas.width, canvas.height);
    this.genericObjects.forEach((obj) => obj.draw());
    this.handleFloor();
    this.handlePlatforms();
    this.handleDistance();
    this.updateVelocity();
    this.updatePlayerPosition();
  }

  handleFloor() {
    if (!canvas) return;

    this.floors.forEach((floor, idx) => {
      if (
        floor.position.x + floor.size.width + canvas.width <
        this.player.position.x
      ) {
        setTimeout(() => {
          this.floors.splice(idx, 1);
        }, 0);
      }

      if (this.checkIsOnObject(floor)) {
        this.player.position.x -= this.floorMovementXDiff;
      }

      const diff = this.keys.right.isPressed
        ? -this.floorMovementXDiff
        : this.keys.left.isPressed
        ? +this.floorMovementXDiff - 1
        : -this.floorMovementXDiff;
      floor.position.x += diff;
      floor.draw();
    });
    this.shouldAddMoreFloors();
  }

  shouldAddMoreFloors() {
    const secondFromLastFloor = this.floors.at(-2);

    if (
      secondFromLastFloor &&
      this.player.position.x >= secondFromLastFloor.position.x
    ) {
      const lastFloor = this.floors.at(-1);
      if (lastFloor) {
        const floors =
          this.createFloors(
            lastFloor.position.x + lastFloor.size.width + getRandomInt(120, 350)
          ) || [];
        this.floors.push(...floors);
      }
    }
  }

  updateVelocity() {
    if (this.isOnFloor || this.isOnPlatform) {
      this.velocity.y = 0;
      this.jumpsCounter = 0;
    } else {
      this.velocity.y += this.gravity;
    }
    if (this.canGoRight) {
      this.velocity.x = this.velocityXDiff;
    } else if (this.canGoLeft) {
      this.velocity.x = -this.velocityXDiff;
    } else this.velocity.x = 0;
  }

  updatePlayerPosition() {
    const {
      position,
      size: { width },
    } = this.player;
    position.y += this.velocity.y;
    position.x += this.velocity.x;

    if ((canvas && position.y > canvas?.height) || position.x + width < 0) {
      handleGameOver();
    }
    this.drawPlayer();
  }

  drawPlayer() {
    const {
      position: { x, y },
      playerImage,
    } = this.player;

    if (c && canvas) {
      if (this.bothKeysPressed || this.keys.right.isPressed) {
        playerImage.image = playerImgRight;
      } else if (this.keys.left.isPressed) playerImage.image = playerImgLeft;

      c.drawImage(
        playerImage.image || playerImgRight,
        playerImage.currPlayerImageFramePosition,
        0,
        89,
        103,
        x,
        y,
        89,
        103
      );
    }
    this.numberOfFramesToMovePlayerImage++;
    if (
      this.velocity.y === 0 &&
      this.numberOfFramesToMovePlayerImage >
        Values.NumberOfFramesToMovePlayerImage
    ) {
      this.handlePlayerImage();
      this.numberOfFramesToMovePlayerImage = 0;
    }
  }

  checkIsOnObject(object: GenericObject) {
    const {
      size: { width, height },
      position,
    } = this.player;

    return (
      position.y + height <= object.position.y &&
      position.y + height + this.velocity.y >= object.position.y &&
      position.x + width / 2 <= object.position.x + object.size.width &&
      position.x + width >= object.position.x
    );
  }

  handlePlatforms() {
    canvas &&
      this.platforms.forEach((platform, idx) => {
        if (
          platform.position.x + platform.size.width + canvas.width <
          this.player.position.x
        ) {
          setTimeout(() => {
            this.platforms.splice(idx, 1);
          }, 0);
        }
        platform.position.x -= this.platformMovementXDiff;

        if (this.checkIsOnObject(platform)) {
          this.player.position.x -= this.platformMovementXDiff;
        }

        platform.draw();
      });

    this.shouldAddMorePlatforms();
  }

  shouldAddMorePlatforms() {
    const thirdFromLastPlatform = this.platforms.at(-3);
    if (
      thirdFromLastPlatform &&
      this.player.position.x >= thirdFromLastPlatform.position.x
    ) {
      const lastPlatform = this.platforms.at(-1);
      if (lastPlatform) {
        const { x: posX } = lastPlatform.position;
        const platforms =
          this.getPlatforms(posX, posX + lastPlatform.size.width) || [];
        this.platforms.push(...platforms);
      }
    }
  }

  getPlatforms(minX = 100, maxX = 500) {
    const img = createImage(platformImage);
    return (
      canvas &&
      Array(5)
        .fill('')
        .map(() => {
          minX = getRandomInt(minX + Values.MinXDiffBetweenPlatform, maxX);
          maxX += 500;
          const platform = new GenericObject(
            {
              x: minX,
              y: getRandomInt(320, canvas.height - 250),
            },
            {
              width: getRandomInt(150, 350),
              height: 30,
            },
            img
          );
          return platform;
        })
    );
  }

  async handleDistance() {
    this.numberOfFramesToIncreaseDistance++;
    if (
      this.numberOfFramesToIncreaseDistance <
      Values.NumberOfFramesToIncreaseDistance
    ) {
      return;
    }
    this.distance++;
    this.numberOfFramesToIncreaseDistance = 0;
    if (
      this.distance - Values.RangeToIncreaseSpeed ===
      this.lastDistanceToIncreaseSpeed
    ) {
      this.lastDistanceToIncreaseSpeed = this.distance;
      this.platformMovementXDiff += 0.2;
      await sleep(500);
      this.platformMovementXDiff += 0.1;
      await sleep(500);
      this.platformMovementXDiff += 0.2;
    }
  }

  handlePlayerImage() {
    const { playerImage } = this.player;
    playerImage.currPlayerImageFramePosition =
      playerImage.currPlayerImageFrame * 89;
    playerImage.currPlayerImageFrame++;
    if (
      playerImage.currPlayerImageFrame === Values.NumberOfPlayerFramesInImage
    ) {
      playerImage.currPlayerImageFrame = 0;
    }
  }

  handleOnKey({ code, type }: KeyboardEvent) {
    let velocityY = this.velocityYDiff;
    switch (code) {
      case 'ArrowUp':
      case 'Space':
        if (this.jumpsCounter >= Values.MaxJumpsWhileInAir) return;
        if (type === 'keyup') {
          this.jumpsCounter++;
          // console.log(`You have more ${Values.maxJumpsWhileInAir - this.upCounter} times to jump while air`);
        } else {
          if (this.jumpsCounter > 0) {
            velocityY -= 5;
          }
          this.velocity.y = -velocityY;
        }
        break;
      case 'ArrowDown':
        break;
      case 'ArrowRight':
        if (type === 'keyup') {
          this.keys.right.isPressed = false;
        } else {
          this.keys.right.isPressed = true;
        }
        break;
      case 'ArrowLeft':
        if (type === 'keyup') {
          this.keys.left.isPressed = false;
        } else {
          this.keys.left.isPressed = true;
        }
        break;
    }
  }

  resize() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
}

export class GenericObject {
  position: Position;
  size: Size;
  img: HTMLImageElement;
  constructor(position: Position, size: Size, image: HTMLImageElement) {
    this.position = position;
    this.size = size;
    this.img = image;
  }

  draw() {
    const {
      position: { x, y },
      size: { width, height },
      img,
    } = this;
    if (c) {
      c.drawImage(img, x, y, width, height);
    }
  }
}
function shouldInitGame() {
  numOfLoadedImages++;
  if (numOfLoadedImages === Values.NumberOfImages) {
    initGame();
  }
}

function initGame() {
  const initialProperties = window.structuredClone<IPlayer>(
    InitialPlayerProperties
  );
  initialProperties.playerImage = {
    image: playerImgRight,
    currPlayerImageFrame: 0,
    currPlayerImageFramePosition: 0,
  };
  const player = new Game(initialProperties);
  window.addEventListener('keydown', player.handleOnKey.bind(player));
  window.addEventListener('keyup', player.handleOnKey.bind(player));
}

function handleGameOver() {
  cancelAnimationFrame(requestAnimationId);
  const elGameOverModal = document.querySelector('.game-over');
  elGameOverModal?.classList.add('show');
}

function onRestart() {
  window.removeEventListeners({ shouldRemoveAll: true });
  initGame();
  document.querySelector('.game-over')?.classList.remove('show');
}
