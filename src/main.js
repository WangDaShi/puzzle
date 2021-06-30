import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'A puzzle a day!'
	}
});

export default app;