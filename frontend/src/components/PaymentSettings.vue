<template>
  <div class="payment-settings">
    <div class="payment-header">
      <h1>프렌츠 결제</h1>
      <p>알림톡 발송을 위한 충전 서비스</p>
    </div>

    <div class="payment-content">
      <!-- 잔액 표시 -->
      <div class="balance-card">
        <div class="balance-label">현재 잔액</div>
        <div class="balance-amount">{{ formatCurrency(balance) }}</div>
        <div class="balance-description">
          알림톡 발송 시 자동으로 차감됩니다
        </div>
      </div>

      <!-- 충전 금액 선택 -->
      <div class="charge-section">
        <h2>충전 금액 선택</h2>
        <div class="charge-amounts-grid">
          <button
            v-for="item in chargeAmounts"
            :key="item.value"
            :class="['charge-amount-btn', { active: chargeAmount === item.value }]"
            @click="chargeAmount = item.value"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="custom-amount-input">
          <label>직접 입력</label>
          <input
            type="number"
            class="form-control"
            v-model.number="chargeAmount"
            min="1000"
            step="1000"
            placeholder="최소 1,000원"
          />
          <span class="input-hint">최소 충전 금액: 1,000원</span>
        </div>
      </div>

      <!-- 결제 수단 선택 -->
      <div class="payment-method-section">
        <h2>결제 수단</h2>
        <div class="payment-methods">
          <label class="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              v-model="paymentMethod"
            />
            <span>신용카드</span>
          </label>
          <label class="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="bank"
              v-model="paymentMethod"
            />
            <span>계좌이체</span>
          </label>
          <label class="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="virtual"
              v-model="paymentMethod"
            />
            <span>가상계좌</span>
          </label>
        </div>
      </div>

      <!-- 충전 버튼 -->
      <div class="charge-action">
        <button
          class="btn btn-primary btn-large"
          @click="handleCharge"
          :disabled="loading || chargeAmount < 1000"
        >
          {{ loading ? '처리 중...' : `${formatCurrency(chargeAmount)} 충전하기` }}
        </button>
      </div>

      <!-- 충전 내역 -->
      <div class="charge-history-section">
        <h2>충전 내역</h2>
        <div v-if="chargeHistory.length === 0" class="empty-history">
          충전 내역이 없습니다.
        </div>
        <table v-else class="charge-history-table">
          <thead>
            <tr>
              <th>충전일시</th>
              <th>충전금액</th>
              <th>결제수단</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in chargeHistory" :key="item.id">
              <td>{{ formatDate(item.created_at) }}</td>
              <td>{{ formatCurrency(item.amount) }}</td>
              <td>{{ getPaymentMethodLabel(item.payment_method) }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(item.status)]">
                  {{ getStatusLabel(item.status) }}
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
import api from '../api'

const balance = ref(0)
const chargeAmount = ref(10000)
const paymentMethod = ref('card')
const chargeHistory = ref([])
const loading = ref(false)

const chargeAmounts = [
  { label: '1만원', value: 10000 },
  { label: '3만원', value: 30000 },
  { label: '5만원', value: 50000 },
  { label: '10만원', value: 100000 },
  { label: '30만원', value: 300000 },
  { label: '50만원', value: 500000 }
]

onMounted(() => {
  loadBalance()
  loadChargeHistory()
})

const loadBalance = async () => {
  try {
    const response = await api.get('/api/payment/balance')
    if (response.data.success) {
      balance.value = response.data.data.balance || 0
    }
  } catch (error) {
    console.error('잔액 조회 오류:', error)
  }
}

const loadChargeHistory = async () => {
  try {
    const response = await api.get('/api/payment/history')
    if (response.data.success) {
      chargeHistory.value = response.data.data || []
    }
  } catch (error) {
    console.error('충전 내역 조회 오류:', error)
  }
}

const handleCharge = async () => {
  if (chargeAmount.value < 1000) {
    alert('최소 충전 금액은 1,000원입니다.')
    return
  }

  loading.value = true
  try {
    const response = await api.post('/api/payment/charge', {
      amount: chargeAmount.value,
      paymentMethod: paymentMethod.value
    })

    if (response.data.success) {
      if (response.data.data.paymentData) {
        openPaymentModal(response.data.data.paymentData)
      } else {
        alert('결제 정보를 받아올 수 없습니다.')
      }
    }
  } catch (error) {
    console.error('충전 오류:', error)
    alert('충전에 실패했습니다: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

const openPaymentModal = (paymentData) => {
  if (window.IMP) {
    const IMP_UID = import.meta.env.VITE_IMP_UID || 'store-3c5e5309-e75f-42a4-8569-684a94c70a82'
    
    window.IMP.init(IMP_UID)
    window.IMP.request_pay(paymentData, (rsp) => {
      if (rsp.success) {
        api.post('/api/payment/verify', {
          imp_uid: rsp.imp_uid,
          merchant_uid: rsp.merchant_uid,
          amount: rsp.paid_amount
        })
          .then(response => {
            if (response.data.success) {
              alert(`충전이 완료되었습니다.\n충전 금액: ${formatCurrency(response.data.data.chargedAmount)}\n현재 잔액: ${formatCurrency(response.data.data.balance)}`)
              loadBalance()
              loadChargeHistory()
            } else {
              alert('충전 처리 중 오류가 발생했습니다: ' + response.data.error)
            }
          })
          .catch(error => {
            console.error('결제 검증 오류:', error)
            alert('결제 검증 중 오류가 발생했습니다.')
          })
      } else {
        let errorMsg = '결제에 실패했습니다.'
        if (rsp.error_msg) {
          errorMsg += '\n' + rsp.error_msg
        }
        alert(errorMsg)
        
        api.post('/api/payment/fail', {
          merchant_uid: rsp.merchant_uid,
          error_code: rsp.error_code,
          error_msg: rsp.error_msg
        }).catch(err => console.error('실패 내역 저장 오류:', err))
      }
    })
  } else {
    alert('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.')
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ko-KR')
}

const getPaymentMethodLabel = (method) => {
  const labels = {
    card: '신용카드',
    bank: '계좌이체',
    virtual: '가상계좌'
  }
  return labels[method] || method
}

const getStatusClass = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'pending') return 'pending'
  return 'failed'
}

const getStatusLabel = (status) => {
  const labels = {
    completed: '완료',
    pending: '대기',
    failed: '실패'
  }
  return labels[status] || status
}
</script>

<style scoped>
.payment-settings {
  padding: 2rem 0;
}

.payment-header {
  text-align: center;
  margin-bottom: 2rem;
}

.payment-header h1 {
  font-size: 2rem;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.payment-header p {
  color: #718096;
}

.payment-content {
  max-width: 800px;
  margin: 0 auto;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2rem;
}

.balance-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.balance-description {
  font-size: 0.875rem;
  opacity: 0.8;
}

.charge-section {
  margin-bottom: 2rem;
}

.charge-section h2 {
  font-size: 1.25rem;
  color: #1a202c;
  margin-bottom: 1rem;
}

.charge-amounts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.charge-amount-btn {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.charge-amount-btn:hover {
  border-color: #667eea;
}

.charge-amount-btn.active {
  border-color: #667eea;
  background: #f0f4ff;
  color: #667eea;
}

.custom-amount-input {
  margin-top: 1rem;
}

.custom-amount-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.input-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
}

.payment-method-section {
  margin-bottom: 2rem;
}

.payment-method-section h2 {
  font-size: 1.25rem;
  color: #1a202c;
  margin-bottom: 1rem;
}

.payment-methods {
  display: flex;
  gap: 1rem;
}

.payment-method-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.charge-action {
  text-align: center;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.charge-history-section h2 {
  font-size: 1.25rem;
  color: #1a202c;
  margin-bottom: 1rem;
}

.empty-history {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.charge-history-table {
  width: 100%;
  border-collapse: collapse;
}

.charge-history-table th,
.charge-history-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.charge-history-table th {
  font-weight: 600;
  color: #2d3748;
  background: #f7fafc;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.success {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.pending {
  background: #feebc8;
  color: #7c2d12;
}

.status-badge.failed {
  background: #fed7d7;
  color: #742a2a;
}
</style>


