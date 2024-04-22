import express, { Request } from 'express';
import { PHPRequest, PHPResponse } from '@php-wasm/universal';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { AddressInfo } from 'net';

export interface ServerOptions {
	port: number;
	onBind: (port: number) => Promise<any>;
	handleRequest: (request: PHPRequest) => Promise<PHPResponse>;
}

// function shouldCompress(_, res) {
// 	const types = res.getHeader('content-type');
// 	const type = Array.isArray(types) ? types[0] : types;
// 	return type && compressible(type);
// }

export async function startServer(options: ServerOptions) {
	const app = express();
	// app.use(compression({ filter: shouldCompress }));
	// app.use(addTrailingSlash('/wp-admin'));

	const server = await new Promise<
		Server<typeof IncomingMessage, typeof ServerResponse>
	>((resolve, reject) => {
		const server = app.listen(options.port, () => {
			const address = server.address();
			if (address === null || typeof address === 'string') {
				reject(new Error('Server address is not available'));
			} else {
				resolve(server);
			}
		});
	});

	const address = server.address();
	const port = (address! as AddressInfo).port;
	await options.onBind(port);

	app.use('/', async (req, res) => {
		const phpResponse = await options.handleRequest({
			url: req.url,
			headers: parseHeaders(req),
			method: req.method as any,
			body: await bufferRequestBody(req),
		});

		res.statusCode = phpResponse.httpStatusCode;
		for (const key in phpResponse.headers) {
			res.setHeader(key, phpResponse.headers[key]);
		}

		res.end(phpResponse.text);
	});
}

const bufferRequestBody = async (req: Request): Promise<Uint8Array> =>
	await new Promise((resolve) => {
		const body: Uint8Array[] = [];
		req.on('data', (chunk) => {
			body.push(chunk);
		});
		req.on('end', () => {
			resolve(Buffer.concat(body));
		});
	});

const parseHeaders = (req: Request): Record<string, string> => {
	const requestHeaders: Record<string, string> = {};
	if (req.rawHeaders && req.rawHeaders.length) {
		for (let i = 0; i < req.rawHeaders.length; i += 2) {
			requestHeaders[req.rawHeaders[i].toLowerCase()] =
				req.rawHeaders[i + 1];
		}
	}
	return requestHeaders;
};
