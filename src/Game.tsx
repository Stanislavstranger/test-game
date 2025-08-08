import { useRef, useEffect, useState } from "react";

const GROUND_Y = 160;
const OBSTACLE_W = 48;
const OBSTACLE_H = 48;
const GOOSE_W = 48;
const GOOSE_H = 48;
const GRAVITY = 0.7;
const JUMP_VY = -12;
const BULLDOZER_TIME = 8000;

export default function GooseGame() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [inBulldozer, setInBulldozer] = useState(false);

  const gooseImg = useRef(null);
  const spiderImg = useRef(null);
  const boxImg = useRef(null);
  const bulldozerImg = useRef(null);
  const bulldozerEmptyImg = useRef(null);

  const [width, setWidth] = useState(window.innerWidth - 60);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth - 60);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    gooseImg.current = new window.Image();
    spiderImg.current = new window.Image();
    boxImg.current = new window.Image();
    bulldozerImg.current = new window.Image();
    bulldozerEmptyImg.current = new window.Image();

    gooseImg.current.src = "goose.png";
    spiderImg.current.src = "spider.png";
    boxImg.current.src = "box.png";
    bulldozerImg.current.src = "bulldozer.png";
    bulldozerEmptyImg.current.src = "bulldozer_empty.png";
  }, []);

  const game = useRef({
    gooseY: GROUND_Y,
    vy: 0,
    obstacles: [],
    boxes: [],
    bulldozers: [],
    speed: 6,
    tick: 0,
    boxTick: 0,
    bulldozerTick: 0,
    started: false,
    score: 0,
    bulldozerMode: false,
    bulldozerEnd: 0,
  });

  useEffect(() => {
    let animId;

    const update = () => {
      const state = game.current;
      const now = Date.now();

      if (state.bulldozerMode && now > state.bulldozerEnd) {
        state.bulldozerMode = false;
        setInBulldozer(false);
      }

      state.gooseY += state.vy;
      state.vy += GRAVITY;
      if (state.gooseY > GROUND_Y) {
        state.gooseY = GROUND_Y;
        state.vy = 0;
      }

      state.obstacles.forEach((ob) => (ob.x -= state.speed));
      state.boxes.forEach((b) => (b.x -= state.speed));
      state.bulldozers.forEach((b) => (b.x -= state.speed));

      state.obstacles = state.obstacles.filter((ob) => ob.x + OBSTACLE_W > 0);
      state.boxes = state.boxes.filter((b) => b.x + 32 > 0);
      state.bulldozers = state.bulldozers.filter((b) => b.x + 48 > 0);

      state.tick++;

      const lastEntityX = Math.max(
        ...state.obstacles.map((o) => o.x),
        ...state.boxes.map((b) => b.x),
        ...state.bulldozers.map((b) => b.x),
        0,
      );

      if (state.tick > 70 + Math.random() * 60 && lastEntityX < width - 100) {
        state.obstacles.push({
          x: width,
          y: GROUND_Y,
          w: OBSTACLE_W,
          h: OBSTACLE_H,
        });
        state.tick = 0;
      }

      state.boxTick++;
      if (state.boxTick > 100 + Math.random() * 150) {
        state.boxes.push({ x: width, y: GROUND_Y + 10, w: 32, h: 32 });
        state.boxTick = 0;
      }

      state.bulldozerTick++;
      if (state.bulldozerTick > 600 + Math.random() * 600) {
        state.bulldozers.push({ x: width, y: GROUND_Y, w: 48, h: 48 });
        state.bulldozerTick = 0;
      }

      if (!state.bulldozerMode) {
        for (const ob of state.obstacles) {
          if (
            60 < ob.x + ob.w &&
            60 + GOOSE_W > ob.x &&
            state.gooseY + GOOSE_H > ob.y
          ) {
            setGameOver(true);
            return;
          }
        }
      } else {
        state.obstacles = state.obstacles.filter(
          (ob) =>
            !(
              60 < ob.x + ob.w &&
              60 + GOOSE_W > ob.x &&
              state.gooseY + GOOSE_H > ob.y
            ),
        );
      }

      state.boxes = state.boxes.filter((box) => {
        const collected =
          60 < box.x + box.w &&
          60 + GOOSE_W > box.x &&
          state.gooseY + GOOSE_H > box.y;
        if (collected) {
          state.score++;
          setScore((s) => s + 1);
          return false;
        }
        return true;
      });

      state.bulldozers = state.bulldozers.filter((b) => {
        const collected =
          60 < b.x + b.w && 60 + GOOSE_W > b.x && state.gooseY + GOOSE_H > b.y;
        if (collected) {
          state.bulldozerMode = true;
          state.bulldozerEnd = Date.now() + BULLDOZER_TIME;
          setInBulldozer(true);
          return false;
        }
        return true;
      });
    };

    const draw = () => {
      const state = game.current;
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, width, 200);
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, width, 200);
      ctx.fillStyle = "#888";
      ctx.fillRect(0, GROUND_Y + GOOSE_H, width, 6);

      if (inBulldozer && bulldozerImg.current?.complete) {
        ctx.drawImage(bulldozerImg.current, 60, state.gooseY, GOOSE_W, GOOSE_H);
      } else if (gooseImg.current?.complete) {
        ctx.drawImage(gooseImg.current, 60, state.gooseY, GOOSE_W, GOOSE_H);
      } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(60, state.gooseY, GOOSE_W, GOOSE_H);
      }

      state.obstacles.forEach((ob) => {
        if (spiderImg.current?.complete) {
          ctx.drawImage(spiderImg.current, ob.x, ob.y, OBSTACLE_W, OBSTACLE_H);
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(ob.x, ob.y, OBSTACLE_W, OBSTACLE_H);
        }
      });

      state.boxes.forEach((box) => {
        if (boxImg.current?.complete) {
          ctx.drawImage(boxImg.current, box.x, box.y, box.w, box.h);
        } else {
          ctx.fillStyle = "#f4b400";
          ctx.fillRect(box.x, box.y, box.w, box.h);
        }
      });

      state.bulldozers.forEach((b) => {
        if (bulldozerEmptyImg.current?.complete) {
          ctx.drawImage(bulldozerEmptyImg.current, b.x, b.y, b.w, b.h);
        } else {
          ctx.fillStyle = "#a52a2a";
          ctx.fillRect(b.x, b.y, b.w, b.h);
        }
      });

      ctx.fillStyle = "#222";
      ctx.font = "18px monospace";
      ctx.fillText("Score: " + state.score, width - 150, 30);

      if (state.bulldozerMode) {
        const remaining = Math.max(
          0,
          Math.ceil((state.bulldozerEnd - Date.now()) / 1000),
        );
        ctx.fillStyle =
          remaining <= 3
            ? Date.now() % 500 < 250
              ? "#ff0000"
              : "transparent"
            : "#d9534f";
        ctx.font = "16px monospace";
        ctx.fillText("Bulldozer: " + remaining + "s", 20, 30);
      }

      if (gameOver) {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillRect(0, 0, width, 200);
        ctx.fillStyle = "#222";
        ctx.font = "32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", width / 2, 100);
        ctx.font = "18px monospace";
        ctx.fillText("Press SPACE to restart", width / 2, 132);
        ctx.textAlign = "start";
      }
    };

    function loop() {
      if (!gameOver && game.current.started) {
        update();
      }
      draw();
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, inBulldozer, width]);

  useEffect(() => {
    const jump = () => {
      if (!game.current.started || gameOver) {
        game.current = {
          gooseY: GROUND_Y,
          vy: 0,
          obstacles: [],
          boxes: [],
          bulldozers: [],
          speed: 6,
          tick: 0,
          boxTick: 0,
          bulldozerTick: 0,
          started: true,
          score: 0,
          bulldozerMode: false,
          bulldozerEnd: 0,
        };
        setGameOver(false);
        setScore(0);
        setInBulldozer(false);
        return;
      }
      if (game.current.gooseY >= GROUND_Y) {
        game.current.vy = JUMP_VY;
      }
    };

    const onKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        jump();
      }
    };

    const onTouch = () => {
      jump();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouch);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [gameOver]);

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={200}
        tabIndex={0}
        style={{
          border: "2px solid #ccc",
          background: "#fff",
          borderRadius: 10,
        }}
      />
      {!game.current.started && (
        <div style={{ marginTop: 12, color: "#222", fontFamily: "monospace" }}>
          Нажмите <kbd>Пробел</kbd>, <kbd>↑</kbd> или{" "}
          <strong>тапните по экрану</strong> чтобы стартовать и прыгать!
        </div>
      )}
    </div>
  );
}
