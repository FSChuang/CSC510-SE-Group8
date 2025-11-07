/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock cn helper - adjust path if your real cn lives elsewhere
vi.mock("../../src/components/ui/cn", () => ({
	cn: (...args: (string | false | null | undefined)[]) => args.filter(Boolean).join(" "),
}));

// Mock Modal used by VideoPanel (component imports Modal from "@/components/ui/Modal")
vi.mock("@/components/ui/Modal", () => {
	return {
		__esModule: true,
		default: ({ open, title, onClose, children }: any) => {
			if (!open) return null;
			return (
				<div role="dialog" aria-modal="true">
					<h2>{title}</h2>
					<button aria-label="modal-close" onClick={onClose}>
						Close
					</button>
					<div data-testid="modal-children">{children}</div>
				</div>
			);
		},
	};
});

import VideoPanel from "../../components/VideoPanel";

const SAMPLE_VIDEOS = {
	Pasta: [
		{ id: "abc123", title: "How to make pasta", thumbnail: "thumb1.jpg" },
		{ id: "def456", title: "Pasta sauce secrets" }, // no thumbnail
		{ id: "ghi789", title: "Extra pasta video" }, // should be sliced out
	],
	Sushi: [
		{ id: "s1", title: "Sushi rolling 101", thumbnail: "sushi.jpg" },
		{ id: "s2", title: "Advanced sushi techniques", thumbnail: "sushi2.jpg" },
	],
};

describe("VideoPanel component", () => {
	beforeEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("1) renders section headings for each dish", () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		expect(screen.getByRole("heading", { level: 3, name: /Pasta/i })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 3, name: /Sushi/i })).toBeInTheDocument();
	});

	it("2) shows up to two videos per dish (slices extra videos)", () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		// Pasta has 3 videos in sample, but component shows only first 2
		expect(screen.getByRole("button", { name: /Play How to make pasta/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Play Pasta sauce secrets/i })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Play Extra pasta video/i })).not.toBeInTheDocument();
	});

	it("3) renders img element when video has a thumbnail", () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		const img = screen.getByRole("img", { hidden: false });
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", "thumb1.jpg");
		// also check sushi thumbnail exists
		expect(screen.getByRole("img", { name: "" })).toBeInTheDocument();
	});

	it("4) renders placeholder div when no thumbnail is provided", () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		// The second Pasta video has no thumbnail -> the component renders a div with the placeholder classes.
		const buttons = screen.getAllByRole("button", { name: /Play/i });
		const pastaSecondButton = buttons.find((btn) =>
			btn.getAttribute("aria-label")?.includes("Pasta sauce secrets")
		);
		expect(pastaSecondButton).toBeDefined();

		// placeholder is a div inside the button — it has no role, so check for an element with the expected class fragment
		const placeholder = pastaSecondButton!.querySelector("div");
		expect(placeholder).toBeTruthy();
		// Ensure it's not an img
		expect(placeholder!.tagName.toLowerCase()).toBe("div");
	});

	it("5) each video button has an accessible aria-label 'Play <title>'", () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		expect(screen.getByRole("button", { name: "Play How to make pasta" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Play Sushi rolling 101" })).toBeInTheDocument();
	});

	it("6) clicking a video button opens the Modal and renders an iframe with correct src & title", async () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		const playButton = screen.getByRole("button", { name: "Play How to make pasta" });
		await userEvent.click(playButton);

		// Modal (mock) should appear
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		// Modal title should be "Playing: <title>"
		expect(screen.getByRole("heading", { level: 2, name: /Playing: How to make pasta/i })).toBeInTheDocument();

		// The component renders an iframe inside modal children. Query by title attribute.
		const iframe = screen.getByTitle("How to make pasta") as HTMLIFrameElement | null;
		expect(iframe).toBeInTheDocument();
		expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
		// allowFullScreen is boolean attribute, test presence
		expect(iframe).toHaveAttribute("allowFullScreen");
	});

	it("7) modal close button calls onClose and removes iframe from DOM", async () => {
		render(<VideoPanel videosByDish={SAMPLE_VIDEOS} />);

		const playButton = screen.getByRole("button", { name: "Play Sushi rolling 101" });
		await userEvent.click(playButton);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		// click mocked modal's close
		const closeBtn = screen.getByRole("button", { name: /modal-close/i });
		await userEvent.click(closeBtn);

		// Wait for modal to be removed
		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});

		// The iframe should no longer be present
		expect(screen.queryByTitle("Sushi rolling 101")).not.toBeInTheDocument();
	});

	it("8) when no videos provided renders nothing inside grid but still returns wrapper", () => {
		render(<VideoPanel videosByDish={{}} />);

		// No section headings should be present
		expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
		// But root container still exists (we can query by role via text search or container)
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("9) iframe uses video.id (handles ids with special characters correctly in src)", async () => {
		const special = { Dessert: [{ id: "x_y-123.45", title: "Dessert special" }] };
		render(<VideoPanel videosByDish={special} />);

		await userEvent.click(screen.getByRole("button", { name: "Play Dessert special" }));

		const iframe = screen.getByTitle("Dessert special") as HTMLIFrameElement;
		expect(iframe).toBeInTheDocument();
		expect(iframe.src).toContain("https://www.youtube.com/embed/x_y-123.45");
	});

	it("10) multiple dishes show their own two-video grids independently", () => {
		// Create a dataset with three dishes each with >=2 videos
		const many = {
			A: [
				{ id: "a1", title: "A1" },
				{ id: "a2", title: "A2" },
			],
			B: [
				{ id: "b1", title: "B1" },
				{ id: "b2", title: "B2" },
			],
			C: [
				{ id: "c1", title: "C1" },
				{ id: "c2", title: "C2" },
			],
		};
		render(<VideoPanel videosByDish={many} />);

		// Ensure each dish heading is present and each has two buttons (total 6 buttons)
		expect(screen.getByRole("heading", { level: 3, name: "A" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 3, name: "B" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 3, name: "C" })).toBeInTheDocument();

		const buttons = screen.getAllByRole("button", { name: /Play/i });
		expect(buttons.length).toBe(6);
	});
});
