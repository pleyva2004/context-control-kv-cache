<script lang="ts">
	import { ChatMessageThinkingBlock, MarkdownContent } from '$lib/components/app';
	import { useProcessingState } from '$lib/hooks/use-processing-state.svelte';
	import { isLoading } from '$lib/stores/chat.svelte';
	import { fade } from 'svelte/transition';
	import {
		Check,
		Copy,
		Package,
		X,
		Gauge,
		Clock,
		WholeWord,
		ChartNoAxesColumn
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { INPUT_CLASSES } from '$lib/constants/input-classes';
	import ChatMessageActions from './ChatMessageActions.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { config } from '$lib/stores/settings.svelte';
	import { modelName as serverModelName } from '$lib/stores/server.svelte';
	import { copyToClipboard } from '$lib/utils/copy';
	import TextSelectionPopover from './TextSelectionPopover.svelte';

	interface Props {
		class?: string;
		deletionInfo: {
			totalCount: number;
			userMessages: number;
			assistantMessages: number;
			messageTypes: string[];
		} | null;
		editedContent?: string;
		isEditing?: boolean;
		message: DatabaseMessage;
		messageContent: string | undefined;
		onCancelEdit?: () => void;
		onCopy: () => void;
		onConfirmDelete: () => void;
		onDelete: () => void;
		onEdit?: () => void;
		onEditKeydown?: (event: KeyboardEvent) => void;
		onEditedContentChange?: (content: string) => void;
		onNavigateToSibling?: (siblingId: string) => void;
		onRegenerate: () => void;
		onSaveEdit?: () => void;
		onShowDeleteDialogChange: (show: boolean) => void;
		onShouldBranchAfterEditChange?: (value: boolean) => void;
		onBranch?: (selectedText: string) => void;
		showDeleteDialog: boolean;
		shouldBranchAfterEdit?: boolean;
		siblingInfo?: ChatMessageSiblingInfo | null;
		textareaElement?: HTMLTextAreaElement;
		thinkingContent: string | null;
	}

	let {
		class: className = '',
		deletionInfo,
		editedContent = '',
		isEditing = false,
		message,
		messageContent,
		onCancelEdit,
		onConfirmDelete,
		onCopy,
		onDelete,
		onEdit,
		onEditKeydown,
		onEditedContentChange,
		onNavigateToSibling,
		onRegenerate,
		onSaveEdit,
		onShowDeleteDialogChange,
		onShouldBranchAfterEditChange,
		onBranch,
		showDeleteDialog,
		shouldBranchAfterEdit = false,
		siblingInfo = null,
		textareaElement = $bindable(),
		thinkingContent
	}: Props = $props();

	const processingState = useProcessingState();
	let currentConfig = $derived(config());
	let serverModel = $derived(serverModelName());
	let showBranchPopover = $state(false);
	let popoverPosition = $state({ x: 0, y: 0 });
	let selectedText = $state('');
	let messageContentElement: HTMLDivElement | undefined = $state();

	let displayedModel = $derived((): string | null => {
		if (!currentConfig.showModelInfo) return null;

		if (message.model) {
			return message.model;
		}

		return serverModel;
	});

	function handleCopyModel() {
		const model = displayedModel();

		void copyToClipboard(model ?? '');
	}

	function handleSelectionChange() {
		const selection = window.getSelection();
		const text = selection?.toString().trim();

		console.log('🔍 Selection change:', {
			text,
			hasMessageElement: !!messageContentElement,
			onBranch: !!onBranch
		});

		if (!text || text.length === 0) {
			showBranchPopover = false;
			return;
		}

		// Check if the selection is within this message's content
		if (!messageContentElement || !selection?.rangeCount) {
			console.log('❌ No message element or selection range');
			showBranchPopover = false;
			return;
		}

		const range = selection.getRangeAt(0);
		const isWithinMessage = messageContentElement.contains(range.commonAncestorContainer);

		console.log('📍 Selection check:', { isWithinMessage, text });

		if (isWithinMessage) {
			selectedText = text;
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			
			if (rect) {
				// Use viewport coordinates (no scrollY needed for position: fixed)
				const x = rect.left + rect.width / 2;
				const y = rect.bottom + 10;
				
				console.log('📏 Selection rect:', {
					left: rect.left,
					right: rect.right,
					top: rect.top,
					bottom: rect.bottom,
					width: rect.width,
					calculatedX: x,
					calculatedY: y
				});
				
				popoverPosition = { x, y };
				showBranchPopover = true;
			}
		} else {
			showBranchPopover = false;
		}
	}

	function handleMouseUp() {
		// Small delay to ensure selection is complete
		setTimeout(handleSelectionChange, 10);
	}

	function handleBranchClick() {
		if (selectedText && onBranch) {
			onBranch(selectedText);
		}
		showBranchPopover = false;
	}

	// Listen to global selection changes
	$effect(() => {
		console.log('🎯 Effect running, messageContentElement:', !!messageContentElement);
		if (!messageContentElement) return;

		console.log('✅ Adding selectionchange listener');
		document.addEventListener('selectionchange', handleSelectionChange);

		return () => {
			console.log('🧹 Removing selectionchange listener');
			document.removeEventListener('selectionchange', handleSelectionChange);
		};
	});
</script>

<div
	class="text-md group w-full leading-7.5 {className}"
	role="group"
	aria-label="Assistant message with actions"
>
	{#if thinkingContent}
		<ChatMessageThinkingBlock
			reasoningContent={thinkingContent}
			isStreaming={!message.timestamp}
			hasRegularContent={!!messageContent?.trim()}
		/>
	{/if}

	{#if message?.role === 'assistant' && isLoading() && !message?.content?.trim()}
		<div class="mt-6 w-full max-w-[48rem]" in:fade>
			<div class="processing-container">
				<span class="processing-text">
					{processingState.getProcessingMessage()}
				</span>
			</div>
		</div>
	{/if}

	{#if isEditing}
		<div class="w-full">
			<textarea
				bind:this={textareaElement}
				bind:value={editedContent}
				class="min-h-[50vh] w-full resize-y rounded-2xl px-3 py-2 text-sm {INPUT_CLASSES}"
				onkeydown={onEditKeydown}
				oninput={(e) => onEditedContentChange?.(e.currentTarget.value)}
				placeholder="Edit assistant message..."
			></textarea>

			<div class="mt-2 flex items-center justify-between">
				<div class="flex items-center space-x-2">
					<Checkbox
						id="branch-after-edit"
						bind:checked={shouldBranchAfterEdit}
						onCheckedChange={(checked) => onShouldBranchAfterEditChange?.(checked === true)}
					/>
					<Label for="branch-after-edit" class="cursor-pointer text-sm text-muted-foreground">
						Branch conversation after edit
					</Label>
				</div>
				<div class="flex gap-2">
					<Button class="h-8 px-3" onclick={onCancelEdit} size="sm" variant="outline">
						<X class="mr-1 h-3 w-3" />
						Cancel
					</Button>

					<Button class="h-8 px-3" onclick={onSaveEdit} disabled={!editedContent?.trim()} size="sm">
						<Check class="mr-1 h-3 w-3" />
						Save
					</Button>
				</div>
			</div>
		</div>
	{:else if message.role === 'assistant'}
		<div bind:this={messageContentElement} onmouseup={handleMouseUp}>
			{#if config().disableReasoningFormat}
				<pre class="raw-output">{messageContent || ''}</pre>
			{:else}
				<MarkdownContent content={messageContent || ''} />
			{/if}
		</div>

		<TextSelectionPopover
			show={showBranchPopover}
			position={popoverPosition}
			onBranch={handleBranchClick}
		/>
	{:else}
		<div
			bind:this={messageContentElement}
			class="text-sm whitespace-pre-wrap"
			onmouseup={handleMouseUp}
		>
			{messageContent}
		</div>

		<TextSelectionPopover
			show={showBranchPopover}
			position={popoverPosition}
			onBranch={handleBranchClick}
		/>
	{/if}

	<div class="info my-6 grid gap-4">
		{#if displayedModel()}
			<span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
				<span class="inline-flex items-center gap-1">
					<Package class="h-3.5 w-3.5" />

					<span>Model used:</span>
				</span>

				<button
					class="inline-flex cursor-pointer items-center gap-1 rounded-sm bg-muted-foreground/15 px-1.5 py-0.75"
					onclick={handleCopyModel}
				>
					{displayedModel()}

					<Copy class="ml-1 h-3 w-3 " />
				</button>
			</span>
		{/if}

		{#if currentConfig.showMessageStats && message.timings && message.timings.predicted_n && message.timings.predicted_ms}
			{@const tokensPerSecond = (message.timings.predicted_n / message.timings.predicted_ms) * 1000}
			<span class="inline-flex items-center gap-2 text-xs text-muted-foreground">
				<span class="inline-flex items-center gap-1">
					<ChartNoAxesColumn class="h-3.5 w-3.5" />

					<span>Statistics:</span>
				</span>

				<div class="inline-flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					<span
						class="inline-flex items-center gap-1 rounded-sm bg-muted-foreground/15 px-1.5 py-0.75"
					>
						<Gauge class="h-3 w-3" />
						{tokensPerSecond.toFixed(2)} tokens/s
					</span>
					<span
						class="inline-flex items-center gap-1 rounded-sm bg-muted-foreground/15 px-1.5 py-0.75"
					>
						<WholeWord class="h-3 w-3" />
						{message.timings.predicted_n} tokens
					</span>
					<span
						class="inline-flex items-center gap-1 rounded-sm bg-muted-foreground/15 px-1.5 py-0.75"
					>
						<Clock class="h-3 w-3" />
						{(message.timings.predicted_ms / 1000).toFixed(2)}s
					</span>
				</div>
			</span>
		{/if}
	</div>

	{#if message.timestamp && !isEditing}
		<ChatMessageActions
			role="assistant"
			justify="start"
			actionsPosition="left"
			{siblingInfo}
			{showDeleteDialog}
			{deletionInfo}
			{onCopy}
			{onEdit}
			{onRegenerate}
			{onDelete}
			{onConfirmDelete}
			{onNavigateToSibling}
			{onShowDeleteDialogChange}
		/>
	{/if}
</div>

<style>
	.processing-container {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.processing-text {
		background: linear-gradient(
			90deg,
			var(--muted-foreground),
			var(--foreground),
			var(--muted-foreground)
		);
		background-size: 200% 100%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: shine 1s linear infinite;
		font-weight: 500;
		font-size: 0.875rem;
	}

	@keyframes shine {
		to {
			background-position: -200% 0;
		}
	}

	.raw-output {
		width: 100%;
		max-width: 48rem;
		margin-top: 1.5rem;
		padding: 1rem 1.25rem;
		border-radius: 1rem;
		background: hsl(var(--muted) / 0.3);
		color: var(--foreground);
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas,
			'Liberation Mono', Menlo, monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
