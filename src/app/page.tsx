'use client';

import { ChangeEvent, Suspense, cache, use, useState, useTransition } from "react";
import dynamic from "next/dynamic";

import { SearchBar } from "@/components/SearchBar";
import { SailboatResults } from "@/components/SailboatResults";
import { SailboatPreview } from "@/components/SailboatPreview";
import { SearchResult, scoreMatch } from "@/script/searchResults";
import getSailData, { SailData } from "@/script/getSailData";

import useAbortSignallingTransition from "@/hooks/useAbortSignallingTransition";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";
import { schedulerDotYield } from "@/script/schedulerDotYield";

/*
 *
 */
async function filterResults(sailData: SailData, searchTerm: string, abortSignal?: AbortSignal) {
	if (searchTerm == "") return [];

	const start = performance.now();
	const results: SearchResult[] = [];

	for (let sailBoat of sailData.data) {
		// 4:
		await schedulerDotYield();

		// 6:
		if (abortSignal?.aborted) {
			performance.measure("Abort filterResults for: " + searchTerm, { start });
			return [];
		}

		let result: SearchResult = { score: 1.0, item: sailBoat };
		// 1:
		result = scoreMatch(sailBoat, searchTerm);
		if (result) {
			results.push(result);
		}
	}

	results.sort((a, b) => a.score! - b.score!);

	performance.measure("Done filterResults for: " + searchTerm, { start });
	return results;
}

/*
 *
 */
function AutoComplete({ searchTerm, sailData, abortSignal }: { searchTerm: string; sailData: SailData; abortSignal?: AbortSignal }) {
	const results = use(cache(filterResults)(sailData, searchTerm, abortSignal));
	const slicedResults = results.slice(0, 10);

	return results.length == 0 ? (
		<></>
	) : (
		<>
			<SailboatResults results={results}></SailboatResults>
			{slicedResults.map((result: SearchResult) => (
				<SailboatPreview key={result.item.id} result={result}></SailboatPreview>
			))}
		</>
	);
}

/*
 *
 */
function SearchPage() {
	const sailData = use(cache(getSailData)());

	const [isPending, startTransition, signal] = useAbortSignallingTransition();
	const [searchTerm, setSearchTerm] = useState("");
	const [autoCompleteTerm, setAutoCompleteTerm] = useState("");

	// 3:
	// useDebouncedEffect(() => {
	//   startTransition(() => {
	//     setAutoCompleteTerm(searchTerm);
	//   });
	// }, 1000, [searchTerm]);

	const onInput = async (e: ChangeEvent<HTMLInputElement>) => {
		const searchTerm = e.target.value;
		setSearchTerm(searchTerm);
		// 2:
		startTransition(() => {
			setAutoCompleteTerm(searchTerm);
		});
	};

	return (
		<main className={isPending || searchTerm != autoCompleteTerm ? "blurred" : ""}>
			<SearchBar searchTerm={searchTerm} onInput={onInput}></SearchBar>
			<Suspense>
				<AutoComplete searchTerm={autoCompleteTerm} sailData={sailData!} abortSignal={signal}></AutoComplete>
			</Suspense>
		</main>
	);
}

// This disables SSR in NextJS for this Page
const Page = dynamic(async () => SearchPage, { ssr: false });
export default Page;
