export async function resetFormAfter<T>(form: Pick<HTMLFormElement, "reset">, mutation: () => Promise<T>): Promise<T> {
  const result = await mutation();
  form.reset();
  return result;
}
