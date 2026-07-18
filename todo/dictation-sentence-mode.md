# Spec: Chép chính tả theo từng câu (Sentence Dictation Mode) — FE

> File này là spec để một AI/dev khác code phần FE. Không đụng tới BE - phần BE tương ứng nằm ở
> `RemeLearning/todo/dictation-sentence-mode-backend.md` trong repo backend
> (`RemeLearning_Project/RemeLearning`).
>
> **Cập nhật (rev 2)**: đổi mô hình duyệt bài từ "chọn facet (skill/level/topic/examType) → session N
> clip ngẫu nhiên" sang **duyệt theo folder → file**, theo yêu cầu mới: mỗi "component" hiển thị là 1
> folder lấy tên từ BE; click vào folder hiện danh sách bài tập, mỗi bài tập là 1 file (audio) trong
> folder đó. Phần chép-chính-tả-từng-câu (mục "Component structure" bên dưới, phần
> `SentenceDictationRunner`) **không đổi** so với rev 1 - chỉ đổi cách người dùng đi tới 1 lesson.

## Context

Tính năng "Dictation" **đã tồn tại đầy đủ** trong hệ thống, đây không phải xây từ đầu mà là mở rộng:

- **english-service** (`com.remelearning.english.dictation.*`): `DictationLibraryImporter` quét
  `StorageClient` (local/S3) theo convention `<...>/<code>.mp3` + `scripts/<code>.txt`, upsert vào bảng
  `dictation_clips` (mỗi clip = 1 audio + 1 `scriptText` nguyên bài). `DictationController` expose
  `/facets`, `/clips`, `/clips/{id}/audio`, `/sessions/{userId}`, `/attempts`, `/history/{userId}`,
  `/ai-practice/*`. `DictationServiceImpl.submitAttempt` chấm điểm **cả clip một lần** bằng
  `DictationScorer` (WER-based), trả `diff`/`accuracy`/`aiSuggestions`.
- **bff-service**: proxy nguyên vẹn qua `LearnerController` + `EnglishServiceClient`
  (`/api/v1/learners/{userId}/dictation/*`).
- **FE hiện tại** (`src/features/dictation/DictationPage.tsx` + `hooks.ts`): 3 tab Library/AI/History.
  Tab Library: chọn facet (dropdown skill/level/topic/examType) → `startSession` lấy N clip ngẫu nhiên
  → `RunnerCard` cho gõ **toàn bộ script của cả clip vào 1 Textarea**, bấm "Kiểm tra" 1 lần cho cả clip,
  xem diff, bấm "Tiếp theo" sang clip kế. `DictationClipDto` hiện **KHÔNG gửi `scriptText`** cho FE
  (chống lộ đáp án trước khi chấm).
- FE **đã gọi API qua BFF** (`VITE_API_BASE_URL=/api/v1`, `vite.config.ts` proxy `/api` →
  `http://localhost:8080`) — không cần đổi gì ở điểm này, mọi endpoint mới/cũ đều đi qua BFF.

**Yêu cầu (rev 2, thay thế cách duyệt bài của rev 1)**:

1. Tab Library hiển thị danh sách **folder** (component), tên lấy từ BE - mỗi folder là 1 chủ đề.
2. Click vào 1 folder → hiện danh sách **bài tập** (lesson) trong folder đó, mỗi bài tập ứng với 1 file
   audio trong folder.
3. Click vào 1 bài tập → vào màn luyện tập, **chép chính tả từng câu**: nghe câu, gõ đúng thì tự next;
   có nút next thủ công; có nút gợi ý nhưng phải nghe đủ số lần cấu hình (từ BE) mới bật được.

## Quyết định đã chốt (áp dụng cho cả FE và BE, giữ nguyên khi 2 bên code độc lập)

1. **Duyệt bài**: theo folder → file (rev 2), thay hoàn toàn cho facet-filter + random session của
   rev 1. Facet dropdown (skill/level/topic/examType) và "bắt đầu session ngẫu nhiên" **không còn là
   luồng chính** - BE vẫn có thể giữ `/facets` và `/sessions` (không bắt buộc xoá), nhưng FE không gọi
   nữa trừ khi cần `minListensForHint` (xem mục contract).
2. **Chấm điểm**: FE-only, nhanh gọn — BE trả `scriptText` + câu đã tách (`sentences`) cho **1 clip cụ
   thể** khi mở bài (không còn trả kèm trong danh sách bulk, xem mục contract); FE tự so khớp từng câu
   tại client (không có API check-per-sentence mới); khi hết câu, FE ghép lại thành 1 transcript đầy
   đủ và gọi **nguyên API `/attempts` hiện có** để chấm điểm chính thức (giữ nguyên toàn bộ pipeline
   diff/AI-suggestion/weak-point). Đánh đổi: giảm bớt tính năng chống lộ đáp án hiện tại — đã chấp
   nhận.
3. **Audio từng câu**: BE dùng AI (STT alignment qua `faster-whisper` ở `ai-service`) để tính mốc
   `startMs`/`endMs` cho từng câu; FE dùng 1 file audio duy nhất và seek đến đúng đoạn.
4. **Đếm lượt nghe để mở gợi ý**: đếm riêng theo từng câu, reset khi sang câu mới.

## API contract FE sẽ tích hợp (do BE cung cấp — xem file spec BE để biết chi tiết implement)

3 tầng dữ liệu tương ứng 3 màn hình, tách nhẹ/nặng rõ ràng (danh sách thì nhẹ, chỉ khi mở 1 bài mới lấy
script/sentences đầy đủ):

```ts
// Màn 1: danh sách folder (chủ đề)
interface DictationFolder {
  folderId: string
  name: string
  lessonCount: number
}
// GET /learners/{userId}/dictation/folders -> DictationFolder[]

// Màn 2: danh sách bài tập trong 1 folder - nhẹ, KHÔNG có scriptText/sentences
interface DictationLessonSummary {
  clipId: number
  code: string
  title: string
  audioUrl: string
}
// GET /learners/{userId}/dictation/folders/{folderId}/lessons -> DictationLessonSummary[]

// Màn 3: mở 1 bài cụ thể để luyện - đầy đủ, có script tách câu
interface DictationSentence {
  index: number
  text: string
  startMs: number | null // null = clip chưa được AI align, FE phải fallback
  endMs: number | null
}
interface DictationClip {
  clipId: number
  code: string
  title: string
  audioUrl: string
  scriptText: string
  sentences: DictationSentence[]
}
// GET /learners/{userId}/dictation/clips/{clipId} -> DictationClip   (MỚI - trước đây không có
// endpoint lấy chi tiết 1 clip; đây là điểm khác biệt chính so với rev 1, tránh phải tải
// scriptText/sentences của MỌI clip khi chỉ đang duyệt danh sách)

interface DictationFacets {
  // ...các field cũ (skills, levels, topics, examTypes) - không còn dùng ở UI mới
  minListensForHint: number // vẫn cần field này, lấy qua GET /learners/{userId}/dictation/facets
}
```

**Quan trọng**: `startMs`/`endMs` có thể là `null` với các clip cũ chưa được AI align — FE PHẢI code
phòng thủ cho trường hợp này (xem mục "Nút Nghe câu này" bên dưới).

`POST /api/v1/learners/{userId}/dictation/attempts` (hiện có, không đổi payload) vẫn là nơi duy nhất
chấm điểm, nhận `userTranscript` là chuỗi đầy đủ do FE ghép từ các câu, `clipId` lấy từ
`DictationClip.clipId` (màn 3).

Các endpoint/hook cũ (`/facets` phần skills/levels/topics/examTypes, `/clips` bulk-filtered,
`/sessions`) **không bị xoá** ở BE nhưng FE sẽ ngừng dùng cho luồng chính - xem mục "4. Không cần đổi /
cần bỏ" bên dưới.

## Implementation Plan

### 1. Types (`src/types/api.ts`)

- Thêm `DictationFolder { folderId: string; name: string; lessonCount: number }`.
- Thêm `DictationLessonSummary { clipId: number; code: string; title: string; audioUrl: string }`.
- Thêm `DictationSentence { index: number; text: string; startMs: number | null; endMs: number | null }`.
- `DictationClip`: **rút gọn lại** theo shape mới ở mục contract (bỏ `skill`/`level`/`topic`/`examType`
  khỏi type này nếu BE không còn trả các field đó ở endpoint chi tiết - xác nhận lại với BE spec trước
  khi xoá field khỏi type; nếu BE vẫn trả kèm cho tiện thì giữ, không bắt buộc xoá) + thêm `scriptText`
  và `sentences: DictationSentence[]`.
- `DictationFacets` thêm `minListensForHint: number` (giữ các field cũ, không dùng ở UI mới nhưng
  không cần xoá type).

### 2. API functions (`src/api/learners.ts`) — 3 hàm mới

```ts
// GET /api/v1/learners/{userId}/dictation/folders - danh sách chủ đề (folder)
export async function getDictationFolders(userId: string): Promise<DictationFolder[]>

// GET /api/v1/learners/{userId}/dictation/folders/{folderId}/lessons - bài tập trong 1 folder
export async function getDictationFolderLessons(
  userId: string,
  folderId: string
): Promise<DictationLessonSummary[]>

// GET /api/v1/learners/{userId}/dictation/clips/{clipId} - chi tiết 1 bài để luyện (script + sentences)
export async function getDictationClip(userId: string, clipId: number): Promise<DictationClip>
```

Theo đúng pattern các hàm hiện có trong file này (axios qua `apiClient`, `unwrap(data)`).
`dictationClipAudioUrl` giữ nguyên, không đổi.

### 3. Hooks (`src/features/dictation/hooks.ts`) — 3 hook mới, dùng React Query như các hook khác

```ts
export function useDictationFolders(userId: string) // queryKey: ["learner", userId, "dictation", "folders"]
export function useDictationFolderLessons(userId: string, folderId: string | null)
  // queryKey: ["learner", userId, "dictation", "folders", folderId, "lessons"], enabled: !!folderId
export function useDictationClip(userId: string, clipId: number | null)
  // queryKey: ["learner", userId, "dictation", "clips", clipId], enabled: !!clipId
```

`useDictationFacets` giữ nguyên (vẫn cần cho `minListensForHint`).

### 4. Component structure (`src/features/dictation/`)

- **`DictationPage.tsx`** (sửa): `LibrarySection` đổi thành 1 state machine 3 màn hình thay vì
  facet-filter + session:

  ```
  view: "folders" | "lessons" | "runner" | "result"
  selectedFolderId, selectedClipId
  ```

  - **Màn "folders"**: `useDictationFolders(userId)` → hiển thị lưới/list card, mỗi card là 1 folder
    (`name` + `lessonCount`, ví dụ "12 bài"). Click → `setSelectedFolderId(folder.folderId)`,
    `setView("lessons")`.
  - **Màn "lessons"**: `useDictationFolderLessons(userId, selectedFolderId)` → list các bài
    (`title`/`code`), có nút quay lại "folders". Click 1 bài → `setSelectedClipId(clipId)`,
    `setView("runner")`.
  - **Màn "runner"**: `useDictationClip(userId, selectedClipId)` lấy chi tiết clip (script+sentences),
    render `SentenceDictationRunner` (xem mục 5, không đổi so với rev 1). Khi runner hoàn thành, gọi
    `submitAttempt` (hook `useSubmitDictationAttempt` có sẵn) với transcript ghép → `setView("result")`.
  - **Màn "result"**: hiển thị `AttemptResultPanel` (tách từ `RunnerCard` cũ, xem rev 1 - không đổi:
    diff/accuracy/AI suggestions). Nút "Bài tiếp theo trong folder" (tiện ích, optional - lấy bài kế
    tiếp trong danh sách `useDictationFolderLessons` đã fetch, set `selectedClipId` mới, quay lại
    `view="runner"`) và nút "Về danh sách bài" (`setView("lessons")`).
  - Bỏ hẳn: `FacetSelect`, state `filters`, `handleStart`/`startSession`, vòng lặp `clips`/`index` theo
    session ngẫu nhiên, `SessionSummary` kiểu "trung bình độ chính xác cả session" (không còn khái
    niệm session nhiều bài ngẫu nhiên - mỗi lần chỉ luyện 1 bài đã chọn rõ ràng). Nếu muốn giữ cảm giác
    "luyện nhiều bài liên tiếp", dùng nút "Bài tiếp theo trong folder" ở trên thay thế.
  - `AiPracticeSection`/`HistorySection` giữ nguyên hoàn toàn, không đụng.

- **`SentenceDictationRunner.tsx`**, **`useSentenceRunner.ts`**, **`AttemptResultPanel`** — **giữ
  nguyên thiết kế như rev 1** (xem lịch sử file/plan gốc nếu cần chi tiết): props `clip: DictationClip`,
  `minListensForHint: number`, `onComplete: (fullTranscript: string) => void`; state machine so khớp
  từng câu (chuẩn hoá lowercase/bỏ dấu câu/gộp khoảng trắng), auto-advance khi đúng, nút next thủ công,
  nút gợi ý gate theo `listenCount` mỗi câu, seek audio theo `startMs`/`endMs` (fallback phát nguyên
  file khi null). Không lặp lại chi tiết ở đây để tránh lệch giữa 2 bản mô tả - phần này áp dụng y hệt,
  chỉ khác nguồn `clip` giờ đến từ `useDictationClip` thay vì từ mảng `clips[index]` của session.

- **Điều hướng**: dùng `useState` cục bộ trong `LibrarySection` (không cần thêm route con
  `react-router`) để nhất quán với cách `DictationPage.tsx` hiện quản lý tab bằng `useState`. Nếu về
  sau cần deep-link tới 1 bài cụ thể (chia sẻ link), có thể nâng cấp thành query param
  (`?folder=x&clip=y`) - không bắt buộc trong lượt này.

### 5. i18n (`src/i18n/locales/en.json` + `vi.json`, namespace `dictation`)

Thêm khoá mới (giữ nguyên khoá cũ, rà lại khoá nào của rev 1 vẫn dùng ở `AttemptResultPanel`):

| Key | vi | en (gợi ý) |
|---|---|---|
| `dictation.folders.title` | "Chọn chủ đề" | "Choose a topic" |
| `dictation.folders.lessonCount` | "{{count}} bài" | "{{count}} lessons" |
| `dictation.folders.empty` | "Chưa có chủ đề nào" | "No topics yet" |
| `dictation.lessons.back` | "Quay lại chủ đề" | "Back to topics" |
| `dictation.lessons.empty` | "Chủ đề này chưa có bài nào" | "This topic has no lessons yet" |
| `dictation.result.nextLesson` | "Bài tiếp theo" | "Next lesson" |
| `dictation.result.backToLessons` | "Về danh sách bài" | "Back to lesson list" |
| `dictation.sentenceProgress` | "Câu {{current}}/{{total}}" | "Sentence {{current}}/{{total}}" |
| `dictation.listenSentence` | "Nghe câu này" | "Listen to this sentence" |
| `dictation.nextSentence` | "Câu tiếp theo" | "Next sentence" |
| `dictation.hint` | "Gợi ý" | "Hint" |
| `dictation.hintLocked` | "Nghe thêm {{count}} lần nữa để mở gợi ý" | "Listen {{count}} more time(s) to unlock the hint" |
| `dictation.sentenceCorrect` | "Chính xác!" | "Correct!" |

Xoá/giữ lại các khoá facet cũ (`filterExam`, `filterSkill`, `filterLevel`, `filterTopic`, `filterAll`,
`categoryLabel`, `categoryAll`, `accentsLabel`, `adjustFilters*`) tuỳ theo có xoá hẳn `FacetSelect` hay
không - nếu xoá component thì dọn luôn khoá không dùng.

### 6. Không cần đổi / cần bỏ

- `dictationClipAudioUrl`: giữ nguyên.
- Cấu hình base URL/BFF: **không cần đổi** — FE vốn đã gọi qua BFF (`/api` → `:8080`) từ trước.
- `useDictationFacets`/`getDictationFacets`: **giữ lại**, chỉ dùng lấy `minListensForHint` (gọi 1 lần
  khi vào tab Library, không cần hiện dropdown filter nữa).
- `useStartDictationSession`/`startDictationSession`, `getDictationClips`/`useDictationClips` (nếu có):
  không còn dùng ở luồng chính - có thể xoá hoặc để lại không tham chiếu (tuỳ mức độ dọn dẹp muốn làm
  trong lượt này; không bắt buộc xoá ngay).

### 7. Sau khi code xong

- Chạy skill `frontend-standards` để soát code mới theo convention repo.
- Test Vitest cho `useSentenceRunner` (không đổi so với rev 1: chuẩn hoá so khớp, auto-advance, hint
  gating, `fullTranscript` đúng thứ tự).
- Test mới cho state machine 3 màn hình ở `LibrarySection`: click folder → đúng lessons hiện ra; click
  lesson → đúng clip detail được fetch; hoàn thành runner → đúng result hiện ra; "Bài tiếp theo" chuyển
  đúng clip kế trong danh sách đã fetch.
- RTL test cho `SentenceDictationRunner` (không đổi so với rev 1).

## Verification (chạy tay sau khi implement)

1. Xác nhận BE đã có `GET .../dictation/folders`, `GET .../dictation/folders/{folderId}/lessons`,
   `GET .../dictation/clips/{clipId}` (curl/Swagger UI bff-service) — nếu BE spec
   (`RemeLearning/todo/dictation-sentence-mode-backend.md`) chưa xong, có thể tạm mock 3 response này
   để code FE trước, nhưng phải verify lại với BE thật trước khi coi là xong.
2. `npm run dev` → `/dictation` → tab Library → thấy danh sách folder → click 1 folder → thấy danh
   sách bài đúng của folder đó → click 1 bài → vào màn luyện từng câu (giống hệt hành vi rev 1: gõ
   đúng tự next, gõ sai bấm next thủ công vẫn qua, gợi ý gate theo lượt nghe) → hết câu cuối → thấy
   panel kết quả đúng như flow cũ → bấm "Bài tiếp theo"/"Về danh sách bài" hoạt động đúng.
3. Test clip có `startMs`/`endMs` null → vẫn luyện được, "Nghe câu này" phát nguyên file.
4. Test folder rỗng (0 bài) và trường hợp chưa có folder nào → hiện đúng empty state, không crash.
5. `npm run lint` / type-check pass.
