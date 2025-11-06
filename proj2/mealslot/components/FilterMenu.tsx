"use client";

import React from "react"
import { useEffect, useState } from "react";
import { cn } from "./ui/cn"; // assuming you have your cn helper

type FilterMenuProps = {
	onTagChange: (tags: string[]) => void;
	onAllergenChange: (allergens: string[]) => void;
};

export default function FilterMenu({ onTagChange, onAllergenChange }: FilterMenuProps) {
	const [tags, setTags] = useState<string[]>([]);
	const [allergens, setAllergens] = useState<string[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

	useEffect(() => {
		fetch("/api/filters")
			.then(res => res.json())
			.then(data => {
				setTags(data.tags ?? []);
				setAllergens(data.allergens ?? []);
			})
			.catch(err => console.error("Failed to fetch filters:", err));
	}, []);

	const toggleTag = (tag: string) => {
		const updated = selectedTags.includes(tag)
			? selectedTags.filter(t => t !== tag)
			: [...selectedTags, tag];
		setSelectedTags(updated);
		onTagChange(updated);
	};

	const toggleAllergen = (allergen: string) => {
		const updated = selectedAllergens.includes(allergen)
			? selectedAllergens.filter(a => a !== allergen)
			: [...selectedAllergens, allergen];
		setSelectedAllergens(updated);
		onAllergenChange(updated);
	};

	return (
		<section className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
			<h2 className="text-lg font-semibold">Filters</h2>

			{/* Tags Dropdown */}
			<details className="border rounded-md p-2">
				<summary className="cursor-pointer font-medium">Tags</summary>
				<div className="mt-2 flex flex-wrap gap-2">
					{tags.map(tag => (
						<button
							key={tag}
							onClick={() => toggleTag(tag)}
							className={cn(
								"rounded-full border px-3 py-1 text-sm",
								selectedTags.includes(tag) ? "bg-neutral-900 text-white" : "bg-white"
							)}
							aria-pressed={selectedTags.includes(tag)}
						>
							{tag}
						</button>
					))}
				</div>
			</details>

			{/* Allergens Dropdown */}
			<details className="border rounded-md p-2">
				<summary className="cursor-pointer font-medium">Allergens</summary>
				<div className="mt-2 flex flex-wrap gap-2">
					{allergens.map(a => (
						<button
							key={a}
							onClick={() => toggleAllergen(a)}
							className={cn(
								"rounded-full border px-3 py-1 text-sm",
								selectedAllergens.includes(a) ? "bg-neutral-900 text-white" : "bg-white"
							)}
							aria-pressed={selectedAllergens.includes(a)}
						>
							{a}
						</button>
					))}
				</div>
			</details>
		</section>
	);
}
