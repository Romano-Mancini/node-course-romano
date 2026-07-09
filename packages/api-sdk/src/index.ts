import { client } from "./generated/client.gen";

export * from "./generated";
export { client };

export function configureApiClient(options: {
	baseUrl: string;
	getToken?: () => string | null | undefined;
}) {
	client.setConfig({
		baseUrl: options.baseUrl,
		auth: () => options.getToken?.() ?? undefined,
	});
}
