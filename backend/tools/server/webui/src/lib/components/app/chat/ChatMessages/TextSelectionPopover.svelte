<script lang="ts">
	import { GitBranch } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		onBranch: () => void;
		show: boolean;
		position: { x: number; y: number };
	}

	let { onBranch, show = $bindable(), position }: Props = $props();

	$effect(() => {
		console.log('🎨 TextSelectionPopover - show:', show, 'position:', position);
	});

	function handleBranch() {
		onBranch();
		show = false;
	}
</script>

{#if show}
	<div
		class="fixed animate-in fade-in-0 zoom-in-95"
		style="left: {position.x}px; top: {position.y}px; z-index: 9999;"
	>
		<div class="rounded-lg border bg-background p-1 shadow-lg">
			<Button variant="ghost" size="sm" class="gap-2 text-sm font-medium" onclick={handleBranch}>
				<GitBranch class="h-4 w-4" />
				Follow Up
			</Button>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes zoom-in {
		from {
			transform: translateX(-50%) scale(0.95);
		}
		to {
			transform: translateX(-50%) scale(1);
		}
	}

	.animate-in {
		animation:
			fade-in 150ms ease-out,
			zoom-in 150ms ease-out;
	}

	.fade-in-0 {
		animation-duration: 150ms;
	}

	.zoom-in-95 {
		animation-duration: 150ms;
	}
</style>
