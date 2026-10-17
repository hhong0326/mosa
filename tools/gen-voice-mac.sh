#!/usr/bin/env bash
# macOS 내장 음성으로 음성 클립 생성 — 계정·네트워크 불필요
#
#   tools/gen-voice-mac.sh [음성=Yuna] [최대=70]
#
# 결과: voice/n/1..N.m4a, voice/count/1..N.m4a, voice/sleep.m4a (AAC, 모든 브라우저 재생 가능)
# 더 좋은 음성: 시스템 설정 → 손쉬운 사용 → 말하기 콘텐츠 → 음성 관리 → 한국어 유나(프리미엄) 설치 후 재실행
# CLOVA 어린이 음성(tools/gen-voice.mjs)이 생기면 이 파일들을 지우고 그걸로 교체하면 됨
set -euo pipefail
cd "$(dirname "$0")/.."
VOICE=${1:-Yuna}
MAX=${2:-70}
RATE=150   # 말하기 속도 (기본 175, 아이용으로 조금 천천히)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

mkdir -p voice/n voice/count

# key<TAB>text 목록을 node로 생성
node -e '
const O=["","하나","둘","셋","넷","다섯","여섯","일곱","여덟","아홉"], D=["","한","두","세","네","다섯","여섯","일곱","여덟","아홉"];
const T=["","열","스물","서른","마흔","쉰","예순","일흔","여든","아흔"];
const num=n=>T[Math.floor(n/10)]+O[n%10];
const cnt=n=>{const t=Math.floor(n/10),o=n%10;return((t===2&&o===0)?"스무":T[t]+D[o])+" 마리"};
const max=+process.argv[1];
for(let n=1;n<=max;n++) console.log(`n/${n}\t${num(n)}!`);
for(let n=1;n<=max;n++) console.log(`count/${n}\t오늘은 고래를 ${cnt(n)} 먹었어요. 잘 자요.`);
console.log("sleep\t바다가 잠들었어요. 잘 자요.");
' "$MAX" | while IFS=$'\t' read -r key text; do
  out="voice/$key.m4a"
  [ -f "$out" ] && { echo "skip  $out"; continue; }
  say -v "$VOICE" -r "$RATE" -o "$TMP/clip.aiff" "$text"
  afconvert -f m4af -d aac -b 48000 "$TMP/clip.aiff" "$out"
  echo "wrote $out  \"$text\""
done
echo "완료: $(find voice -name '*.m4a' | wc -l | tr -d ' ')개"
