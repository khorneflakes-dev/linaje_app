<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement;

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          dispatch('load', json);
        } catch (error) {
          console.error('Invalid JSON', error);
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  }
</script>

<div class="flex items-center">
  <label class="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                bg-slate-600 text-white dark:text-slate-900 hover:bg-slate-700
                dark:bg-slate-200 dark:hover:bg-slate-100">
    <span>Subir JSON</span>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json"
      on:change={handleFileUpload}
      class="hidden"
    />
  </label>
</div>
