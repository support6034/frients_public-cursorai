<template>
  <div class="payment-settings">
    <div class="payment-header mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">프렌츠 결제</h1>
      <p class="text-gray-600">알림톡 발송을 위한 충전 서비스</p>
    </div>

    <div class="payment-content">
      <!-- 잔액 표시 -->
      <div class="balance-card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-lg mb-8 text-center">
        <div class="balance-label text-lg mb-2">현재 잔액</div>
        <div class="balance-amount text-4xl font-bold mb-2">{{ formatCurrency(paymentBalance) }}</div>
        <div class="balance-description text-sm opacity-90">
          알림톡 발송 시 자동으로 차감됩니다
        </div>
      </div>

      <!-- 충전 금액 선택 -->
      <div class="charge-section mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">충전 금액 선택</h2>
        <div class="charge-amounts-grid grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          <button
            v-for="item in chargeAmounts"
            :key="item.value"
            :class="[
              'charge-amount-btn px-4 py-3 border-2 rounded-lg font-medium transition-all',
              chargeAmount === item.value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-indigo-300'
            ]"
            @click="chargeAmount = item.value"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="custom-amount-input">
          <label class="block mb-2 font-medium text-gray-700">직접 입력</label>
          <input
            type="number"
            v-model.number="chargeAmount"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            min="1000"
            step="1000"
            placeholder="최소 1,000원"
          />
          <span class="text-sm text-gray-500 mt-1 block">최소 충전 금액: 1,000원</span>
        </div>
      </div>

      <!-- 결제 수단 선택 -->
      <div class="payment-method-section mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">결제 수단</h2>
        <div class="payment-methods flex flex-wrap gap-4">
          <label class="payment-method-option flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="paymentMethod"
              value="card"
              class="w-4 h-4"
            />
            <span>신용카드</span>
          </label>
          <label class="payment-method-option flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="paymentMethod"
              value="bank"
              class="w-4 h-4"
            />
            <span>계좌이체</span>
          </label>
          <label class="payment-method-option flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              v-model="paymentMethod"
              value="virtual"
              class="w-4 h-4"
            />
            <span>가상계좌</span>
          </label>
        </div>
      </div>

      <!-- 충전 버튼 -->
      <div class="charge-action mb-8">
        <button
          class="btn-primary w-full px-6 py-4 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleCharge"
          :disabled="loading || chargeAmount < 1000"
        >
          {{ loading ? '처리 중...' : `${formatCurrency(chargeAmount)} 충전하기` }}
        </button>
      </div>

      <!-- 충전 내역 -->
      <div class="charge-history-section">
        <h2 class="text-xl font-bold text-gray-900 mb-4">충전 내역</h2>
        <div v-if="paymentHistory.length === 0" class="empty-history text-center py-8 text-gray-500">
          충전 내역이 없습니다.
        </div>
        <table v-else class="charge-history-table w-full border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-3 text-left border-b border-gray-200 font-semibold text-gray-700">충전일시</th>
              <th class="px-4 py-3 text-left border-b border-gray-200 font-semibold text-gray-700">충전금액</th>
              <th class="px-4 py-3 text-left border-b border-gray-200 font-semibold text-gray-700">결제수단</th>
              <th class="px-4 py-3 text-left border-b border-gray-200 font-semibold text-gray-700">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in paymentHistory"
              :key="item.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 border-b border-gray-200">{{ formatDate(item.createdAt || item.created_at) }}</td>
              <td class="px-4 py-3 border-b border-gray-200">{{ formatCurrency(item.amount) }}</td>
              <td class="px-4 py-3 border-b border-gray-200">
                {{ item.paymentMethod === 'card' ? '신용카드' : item.paymentMethod === 'bank' ? '계좌이체' : '가상계좌' }}
              </td>
              <td class="px-4 py-3 border-b border-gray-200">
                <span
                  :class="[
                    'status-badge px-2 py-1 rounded text-xs font-semibold',
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]"
                >
                  {{ item.status === 'completed' ? '완료' : item.status === 'pending' ? '대기' : '실패' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '../../stores/notification'
import api from '../../api'

const store = useNotificationStore()

const {
  paymentBalance,
  paymentHistory,
  fetchPaymentBalance,
  fetchPaymentHistory,
  chargePayment,
  verifyPayment
} = store

const loading = ref(false)
const chargeAmount = ref(10000)
const paymentMethod = ref('card')

const chargeAmounts = [
  { label: '1만원', value: 10000 },
  { label: '3만원', value: 30000 },
  { label: '5만원', value: 50000 },
  { label: '10만원', value: 100000 },
  { label: '30만원', value: 300000 },
  { label: '50만원', value: 500000 }
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('ko-KR')
}

const handleCharge = async () => {
  if (chargeAmount.value < 1000) {
    alert('최소 충전 금액은 1,000원입니다.')
    return
  }

  loading.value = true
  try {
    const paymentData = await chargePayment(chargeAmount.value, paymentMethod.value)

    // 포트원(아임포트) 결제 모듈 연동
    if (window.IMP && paymentData) {
      const IMP_UID = import.meta.env.VITE_IMP_UID || 'store-3c5e5309-e75f-42a4-8569-684a94c70a82'
      
      window.IMP.init(IMP_UID)
      window.IMP.request_pay(paymentData, async (rsp) => {
        if (rsp.success) {
          // 결제 성공 - 서버에서 검증
          try {
            const verifyResult = await verifyPayment(rsp.imp_uid, rsp.merchant_uid, rsp.paid_amount)
            alert(`충전이 완료되었습니다.\n충전 금액: ${formatCurrency(verifyResult.chargedAmount)}\n현재 잔액: ${formatCurrency(verifyResult.balance)}`)
          } catch (error) {
            alert('충전 처리 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'))
          }
        } else {
          // 결제 실패
          let errorMsg = '결제에 실패했습니다.'
          if (rsp.error_msg) {
            errorMsg += '\n' + rsp.error_msg
          }
          alert(errorMsg)

          // 실패 내역 저장
          try {
            await api.post('/api/payment/fail', {
              merchant_uid: rsp.merchant_uid,
              error_code: rsp.error_code,
              error_msg: rsp.error_msg
            })
          } catch (err) {
            console.error('실패 내역 저장 오류:', err)
          }
        }
        loading.value = false
      })
    } else {
      alert('결제 정보를 받아올 수 없습니다.')
      loading.value = false
    }
  } catch (error) {
    console.error('충전 오류:', error)
    alert('충전에 실패했습니다: ' + (error.response?.data?.error || error.message))
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPaymentBalance()
  await fetchPaymentHistory()
})
</script>

