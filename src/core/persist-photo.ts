type PhotoFile = { exists: boolean; delete(): void };
type DestinationPhoto = PhotoFile & { size: number };

function removeIfPresent(file: PhotoFile): void {
  try { if (file.exists) file.delete(); } catch { /* 정리 실패가 원래의 저장 오류를 가리지 않게 합니다. */ }
}

/** 복사 중에는 원본 캐시를 유지하고, 실제 파일이 만들어진 뒤에만 반환합니다. */
export async function persistPhoto<T extends DestinationPhoto>(source: PhotoFile & { copy(destination: T): Promise<void> }, destination: T): Promise<void> {
  try {
    await source.copy(destination);
    if (!destination.exists || destination.size <= 0) throw new Error('사진이 저장되지 않았어요. 다시 선택해주세요.');
  } catch (err) {
    removeIfPresent(destination);
    throw err;
  } finally {
    removeIfPresent(source);
  }
}
