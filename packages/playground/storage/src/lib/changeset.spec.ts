import { changeset } from './changeset';

describe('changeset', () => {
	it('should return an empty changeset when no files have changed', async () => {
		const filesBefore = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([4, 5, 6])], 'file2.txt');
		};
		const result = await changeset(filesBefore(), filesBefore());
		expect(result.create.size).toBe(0);
		expect(result.update.size).toBe(0);
		expect(result.delete.size).toBe(0);
	});

	it('should return a changeset with new files', async () => {
		const filesBefore = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
		};
		const filesAfter = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([4, 5, 6])], 'file2.txt');
		};
		const result = await changeset(filesBefore(), filesAfter());
		expect(result.create.size).toBe(1);
		expect(result.create.get('file2.txt')).toEqual(
			new Uint8Array([4, 5, 6])
		);
		expect(result.update.size).toBe(0);
		expect(result.delete.size).toBe(0);
	});

	it('should return a changeset with updated files', async () => {
		const filesBefore = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([4, 5, 6])], 'file2.txt');
		};
		const filesAfter = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([7, 8, 9])], 'file2.txt');
		};
		const result = await changeset(filesBefore(), filesAfter());
		expect(result.create.size).toBe(0);
		expect(result.update.size).toBe(1);
		expect(result.update.get('file2.txt')).toEqual(
			new Uint8Array([7, 8, 9])
		);
		expect(result.delete.size).toBe(0);
	});

	it('should return a changeset with deleted files', async () => {
		const filesBefore = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([4, 5, 6])], 'file2.txt');
		};
		const filesAfter = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
		};
		const result = await changeset(filesBefore(), filesAfter());
		expect(result.create.size).toBe(0);
		expect(result.update.size).toBe(0);
		expect(result.delete.size).toBe(1);
		expect(result.delete.has('file2.txt')).toBe(true);
	});

	it('should return a changeset with new, updated, and deleted files', async () => {
		const filesBefore = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([4, 5, 6])], 'file2.txt');
			yield new File([new Uint8Array([7, 8, 9])], 'file3.txt');
		};
		const filesAfter = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
			yield new File([new Uint8Array([10, 11, 12])], 'file2.txt');
		};
		const result = await changeset(filesBefore(), filesAfter());
		expect(result.create.size).toBe(0);
		expect(result.update.size).toBe(1);
		expect(result.update.get('file2.txt')).toEqual(
			new Uint8Array([10, 11, 12])
		);
		expect(result.delete.size).toBe(1);
		expect(result.delete.has('file3.txt')).toBe(true);
	});

	it('should handle empty filesBefore', async () => {
		const filesBefore = async function* () {};
		const filesAfter = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
		};
		const result = await changeset(filesBefore(), filesAfter());
		expect(result.create.size).toBe(1);
		expect(result.create.get('file1.txt')).toEqual(
			new Uint8Array([1, 2, 3])
		);
		expect(result.update.size).toBe(0);
		expect(result.delete.size).toBe(0);
	});

	it('should handle empty filesAfter', async () => {
		const filesBefore = async function* () {
			yield new File([new Uint8Array([1, 2, 3])], 'file1.txt');
		};
		const filesAfter = async function* () {};
		const result = await changeset(filesBefore(), filesAfter());
		expect(result.create.size).toBe(0);
		expect(result.update.size).toBe(0);
		expect(result.delete.size).toBe(1);
		expect(result.delete.has('file1.txt')).toBe(true);
	});
});
