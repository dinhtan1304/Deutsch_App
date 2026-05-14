---
name: git-flow
description: DeutschMeister monorepo Git workflow. Use when starting a new feature, creating a branch, syncing with main, merging back, or handling the deutschmeister-api submodule. Enforces branch naming tandv_update_{plan}, merge-based sync, submodule-first push order, and lists conflict-prone files.
---

# DeutschMeister Git Flow

Quy trình Git chuẩn cho monorepo `e:\Deutsch_App` (parent + submodule `deutschmeister-api`). Áp dụng MỖI khi user nói "tạo feature mới", "phát triển X", "merge vào main", "deploy", "fix nhanh" hoặc đụng tới submodule.

## 1. Branch naming contract

**Format duy nhất:** `tandv_update_{plan}`

- `{plan}` là kebab-case slug ngắn, viết bằng tiếng Anh không dấu
- Ví dụ hợp lệ: `tandv_update_arena`, `tandv_update_vocab-search`, `tandv_update_payment-fix`, `tandv_update_speaking-rooms`
- KHÔNG dùng `/` (vd `tandv_update_ux/ui` ← sai), KHÔNG dùng tiếng Việt có dấu, KHÔNG date stamp
- 1 nhánh = 1 plan. Khi feature đủ lớn cần tách, tạo nhánh mới `tandv_update_{plan-phase2}`

Trước khi tạo nhánh: chạy `git branch -a` xem đã có nhánh trùng tên chưa.

## 2. Lifecycle 6 bước

### (1) Feature start — branch TỪ origin/main, không phải từ branch khác

```bash
git fetch origin
git checkout -b tandv_update_<plan> origin/main
```

**Tại sao**: nhánh tự nhánh từ branch khác (đã thấy với `tandv_update_speaking_rooms` mọc trên dca0860) sẽ kéo theo commit chưa merge vào main → khi merge vào main đẻ ra conflict chuỗi.

### (2) Develop — commit incremental, message theo type

Format: `<type>(<scope>): <subject>` — type ∈ {`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`}

```bash
git add <files>
git commit -m "feat(arena): add masked-word duel UI"
```

Imperative mood, ngắn gọn. Không bắt buộc body trừ khi commit chạm submodule (lúc đó note SHA mới của submodule trong body).

### (3) Daily sync — merge origin/main vào feature

```bash
git fetch origin
git merge origin/main
```

Chạy MỖI sáng và TRƯỚC khi đụng vào shared file (xem section 4). Giải quyết conflict nhỏ lúc còn fresh tốt hơn 1 đống conflict cuối feature.

### (4) Pre-merge check

```bash
cd deutschmeister-web && npm run build && npm run lint
```

- `npm run build` (next build) bao gồm typecheck — bắt buộc pass
- `npm run lint` — warnings cũ OK, không thêm error mới
- Smoke test bằng `next start` rồi curl các route mới + 1 route auth

### (5) Submodule first push (nếu chạm `deutschmeister-api`)

Section riêng ở phần 3.

### (6) Merge to main

```bash
git checkout main
git pull --ff-only origin main
git merge --ff-only tandv_update_<plan>
git push origin main
```

`--ff-only` đảm bảo nếu main đã advance, lệnh fail thay vì tạo merge commit ngoài ý muốn. Nếu fail → sync feature với main (bước 3) rồi thử lại.

Khi 2+ nhánh diverge song song và cần ship cùng lúc → dùng integration branch (xem section 6).

## 3. Submodule protocol

**Quan trọng**: submodule `deutschmeister-api` đã từng gãy deploy vì pointer ở parent main trỏ tới SHA chưa có trên submodule origin.

### Quy tắc cố định

- Submodule default branch là **`master`** (KHÔNG phải `main`)
- LUÔN push submodule TRƯỚC parent: `git -C deutschmeister-api push origin master` rồi mới `git push origin main`
- Đã set `push.recurseSubmodules = check` trong local config — nếu `git push` parent bị từ chối với "submodule commit not on remote", đó là feature đang bảo vệ, KHÔNG phải bug. Push submodule trước rồi push parent.
- Nhánh feature ở submodule cũng theo `tandv_update_{plan}`, merge xuống `master` rồi push

### Flow chạm submodule

```bash
# 1. Tạo nhánh feature trong submodule (nếu cần)
git -C deutschmeister-api fetch origin
git -C deutschmeister-api checkout -b tandv_update_<plan> origin/master

# 2. Code + commit trong submodule
git -C deutschmeister-api add <files>
git -C deutschmeister-api commit -m "feat(arena): vocabulary arena backend"

# 3. Merge submodule feature xuống master
git -C deutschmeister-api checkout master
git -C deutschmeister-api merge --ff-only tandv_update_<plan>

# 4. Push submodule TRƯỚC
git -C deutschmeister-api push origin master

# 5. Update parent pointer + commit ở parent
git add deutschmeister-api
git commit -m "chore: bump deutschmeister-api submodule"

# 6. Push parent
git push origin main
```

### Khi parent main đã push nhưng deploy báo "object not found"

Submodule pointer chưa lên origin. Fix:
```bash
git -C deutschmeister-api push origin master
```

Không cần làm gì ở parent — pointer đã đúng SHA, chỉ thiếu commit trên remote.

## 4. Conflict-prone file map

Các file dưới đây CÓ KHẢ NĂNG CAO gây merge conflict khi nhiều feature song song. Khi feature plan động vào những file này, ưu tiên:
- Sync `origin/main` xuống feature ngay (bước 3 lifecycle)
- Thêm code ở CUỐI block (cuối array, cuối file, cuối object) thay vì reorder
- Báo trong commit message để dễ trace

| File | Lý do hay conflict | Khi chạm phải |
|---|---|---|
| `deutschmeister-web/src/stores/authStore.ts` | Mỗi feature auth rewrite (persist/bootstrap, refresh logic) | Báo trước trong commit message, sync main ngay sau khi push |
| `deutschmeister-web/src/config/navigation.tsx` | Mọi feature thêm sidebar item | Thêm item ở cuối block, không reorder |
| `deutschmeister-web/src/components/layout/Sidebar.tsx` | Auth state, badge, premium lock đan xen | Tránh refactor cùng lúc thêm feature |
| `deutschmeister-web/src/components/ui/index.ts` | Mọi component mới đều export | Thêm dòng ở cuối, không sort |
| `deutschmeister-web/next.config.ts` | CSP headers đụng chung block | Thêm origin mới vào cuối array, không inline expression |
| `deutschmeister-web/src/app/globals.css` | Animation/utility class chung | Thêm vào cuối section tương ứng |
| `deutschmeister-api/prisma/schema.prisma` | Model User relations + new models | Thêm relations ở cuối block, model mới ở cuối file |
| `deutschmeister-api/src/app.module.ts` | Mọi module mới đều import | Thêm import + entry ở cuối |

## 5. Merge strategies cheat sheet

### 1 nhánh vào main (case chuẩn)

```bash
git checkout main && git pull --ff-only origin main
git merge --ff-only tandv_update_<plan>
git push origin main
```

### 2+ nhánh diverge song song (case `perf` + `speaking_rooms`)

Dùng integration branch để tách conflict resolution khỏi feature branches:

```bash
git checkout -b merge/integration main
git merge --no-ff tandv_update_<plan_a> -m "merge: <plan_a>"
git merge --no-ff tandv_update_<plan_b> -m "merge: <plan_b>"   # resolve conflicts ở đây
# build + smoke test
git checkout main && git merge --ff-only merge/integration
git push origin main
git branch -d merge/integration
```

### Khi conflict ở store/shared file (vd authStore.ts)

Ưu tiên version có refactor LỚN hơn (vd bootstrap pattern thắng 1-line getAccessToken import). KHÔNG cố cherry-pick từng dòng — sẽ break invariant nội tại của refactor. Sau khi resolve, đọc lại file đảm bảo logic mới còn nhất quán.

## 6. Self-check trước khi merge to main

Chạy hết 8 mục dưới đây — bất cứ mục nào fail thì dừng:

- [ ] Branch tên đúng format `tandv_update_{plan}` (kiểm `git branch --show-current`)
- [ ] `git fetch origin && git log --oneline origin/main..HEAD | wc -l` không quá 20 (nếu hơn → cân nhắc squash hoặc split)
- [ ] Đã merge `origin/main` xuống feature trong 24h gần nhất (`git log --merges -1 --grep="origin/main"`)
- [ ] `cd deutschmeister-web && npm run build` pass
- [ ] `npm run lint` không thêm error mới (warnings cũ OK)
- [ ] Nếu submodule có thay đổi: submodule đã commit + push `origin master`, parent đã `git add deutschmeister-api`
- [ ] `git grep -nE "^(<{7}|>{7}|={7})( |$)"` không in ra dòng nào (không còn conflict marker)
- [ ] Smoke test ít nhất 1 route mới + 1 route auth (`/auth/login`)

## 7. Quick commands

```bash
# Start feature
git fetch origin && git checkout -b tandv_update_<plan> origin/main

# Daily sync (chạy mỗi sáng và trước khi sửa shared file)
git fetch origin && git merge origin/main

# Pre-merge verify
cd deutschmeister-web && npm run build && npm run lint

# Submodule first (nếu API thay đổi)
git -C deutschmeister-api push origin master

# Merge to main
git checkout main && git pull --ff-only origin main && git merge --ff-only tandv_update_<plan> && git push origin main

# Rollback nếu push main bị từ chối vì submodule chưa push
git -C deutschmeister-api push origin master && git push origin main
```

## 8. Anti-patterns → correct form

| Anti-pattern | Replace with |
|---|---|
| `git checkout -b new-feature` (tên không theo convention) | `git checkout -b tandv_update_<plan> origin/main` |
| `git checkout -b tandv_update_xxx tandv_update_yyy` (branch từ branch) | `git checkout -b tandv_update_xxx origin/main` |
| `git push origin main` (chưa push submodule) | `git -C deutschmeister-api push origin master` trước, rồi `git push origin main` |
| `git -C deutschmeister-api push origin main` (sai branch) | `git -C deutschmeister-api push origin master` |
| `git merge main` (không fetch trước) | `git fetch origin && git merge origin/main` |
| `git rebase main` (rewrite history nhánh đã push) | `git merge origin/main` |
| Commit message kiểu `update`, `fix bug`, `wip` | `feat(arena): add room creation flow` |
| Sửa và reorder `navigation.tsx` / `ui/index.ts` | Thêm dòng ở cuối block |
