import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  DrawingAssignment,
} from "../../api/client";

import {
  submitDrawingAttempt,
} from "../../api/client";

type Point = {
  x: number;
  y: number;
};

function targetPoints(
  shape: DrawingAssignment["shape"],
): Point[] {
  const count = 64;

  if (shape === "circle") {
    return Array.from(
      { length: count },
      (_, index) => {
        const angle =
          (Math.PI * 2 * index) /
          (count - 1);

        return {
          x:
            0.5 +
            0.38 * Math.cos(angle),
          y:
            0.5 +
            0.38 * Math.sin(angle),
        };
      },
    );
  }

  const vertices =
    shape === "square"
      ? [
          { x: 0.15, y: 0.15 },
          { x: 0.85, y: 0.15 },
          { x: 0.85, y: 0.85 },
          { x: 0.15, y: 0.85 },
          { x: 0.15, y: 0.15 },
        ]
      : [
          { x: 0.5, y: 0.12 },
          { x: 0.88, y: 0.82 },
          { x: 0.12, y: 0.82 },
          { x: 0.5, y: 0.12 },
        ];

  const result: Point[] = [];

  for (let i = 0; i < count; i += 1) {
    const segment =
      Math.floor(
        (i / (count - 1)) *
          (vertices.length - 1),
      );

    const safeSegment = Math.min(
      segment,
      vertices.length - 2,
    );

    const start =
      vertices[safeSegment];
    const end =
      vertices[safeSegment + 1];

    const segmentProgress =
      (
        (i /
          (count - 1)) *
          (vertices.length - 1)
      ) - safeSegment;

    result.push({
      x:
        start.x +
        (end.x - start.x) *
          segmentProgress,
      y:
        start.y +
        (end.y - start.y) *
          segmentProgress,
    });
  }

  return result;
}

export default function DrawingGame({
  assignment,
  onComplete,
}: {
  assignment: DrawingAssignment;
  onComplete?: (
    result: {
      accuracy_percent: number;
      awarded_xp: number;
    },
  ) => void;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const [drawing, setDrawing] =
    useState(false);

  const [points, setPoints] =
    useState<Point[]>([]);

  const [result, setResult] =
    useState<{
      accuracy_percent: number;
      awarded_xp: number;
    } | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const width = 800;
  const height = 600;

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      width,
      height,
    );

    const target =
      targetPoints(assignment.shape);

    context.strokeStyle =
      "#CBD5E1";
    context.lineWidth = 3;
    context.setLineDash([10, 8]);
    context.beginPath();

    target.forEach(
      (point, index) => {
        const x = point.x * width;
        const y = point.y * height;

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      },
    );

    context.stroke();
    context.setLineDash([]);
  }, [assignment.shape]);

  const getPoint = (
    event:
      | React.PointerEvent<HTMLCanvasElement>
      | React.MouseEvent<HTMLCanvasElement>,
  ): Point => {
    const canvas =
      canvasRef.current!;

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) /
        rect.width,
      y:
        (event.clientY - rect.top) /
        rect.height,
    };
  };

  const start = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    const point = getPoint(event);

    setDrawing(true);
    setPoints([point]);

    const context =
      canvasRef.current?.getContext("2d");

    if (!context) return;

    context.strokeStyle =
      "#18775B";
    context.lineWidth =
      assignment.config.strokeWidth || 5;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(
      point.x * width,
      point.y * height,
    );
  };

  const move = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (!drawing) return;

    const point = getPoint(event);

    setPoints((previous) => [
      ...previous,
      point,
    ]);

    const context =
      canvasRef.current?.getContext("2d");

    if (!context) return;

    context.lineTo(
      point.x * width,
      point.y * height,
    );

    context.stroke();
  };

  const stop = () => {
    if (!drawing) return;

    setDrawing(false);
  };

  const clear = () => {
    setPoints([]);
    setResult(null);

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    context.clearRect(
      0,
      0,
      width,
      height,
    );

    const target =
      targetPoints(assignment.shape);

    context.strokeStyle =
      "#CBD5E1";
    context.lineWidth = 3;
    context.setLineDash([10, 8]);
    context.beginPath();

    target.forEach(
      (point, index) => {
        const x = point.x * width;
        const y = point.y * height;

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      },
    );

    context.stroke();
    context.setLineDash([]);
  };

  const submit = async () => {
    if (points.length < 8) {
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await submitDrawingAttempt(
          assignment.assignment_id,
          points,
        );

      setResult(response);
      onComplete?.(response);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="drawing-game">
      <div className="drawing-game__header">
        <div>
          <h2>{assignment.name}</h2>
          {assignment.description && (
            <p>{assignment.description}</p>
          )}
        </div>

        <span>
          Trace the dashed shape
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          maxWidth: 800,
          touchAction: "none",
          border:
            "1px solid #E2E8F0",
          borderRadius: 16,
          background: "white",
        }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
      />

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          className="button"
          onClick={clear}
          disabled={submitting}
        >
          Clear
        </button>

        <button
          type="button"
          className="button button--primary"
          onClick={submit}
          disabled={
            submitting ||
            points.length < 8 ||
            !!result
          }
        >
          {submitting
            ? "Checking..."
            : "Submit drawing"}
        </button>
      </div>

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 16,
            background: "#F0FDF4",
          }}
        >
          <strong>
            {result.accuracy_percent}%
            accuracy
          </strong>

          <p>
            You earned{" "}
            <strong>
              {result.awarded_xp} XP
            </strong>
            !
          </p>
        </div>
      )}
    </section>
  );
}
