// study4 실습용 목업(mock) 데이터.
// 실제 서비스라면 이 데이터는 API에서 fetch로 받아오지만(study6에서 다룸),
// 지금은 라우팅 자체에 집중하기 위해 정적 배열로 둡니다.
export const products = [
  {
    id: 1,
    name: '무선 키보드',
    price: 45000,
    description: '가볍고 조용한 저소음 스위치를 사용한 무선 키보드입니다.',
  },
  {
    id: 2,
    name: '모니터 암',
    price: 32000,
    description: '높이와 각도를 자유롭게 조절할 수 있는 듀얼 모니터 암입니다.',
  },
  {
    id: 3,
    name: '노트북 거치대',
    price: 18000,
    description: '알루미늄 재질로 제작되어 열 방출이 잘 되는 접이식 거치대입니다.',
  },
]

export function findProductById(id) {
  return products.find((p) => p.id === Number(id))
}
