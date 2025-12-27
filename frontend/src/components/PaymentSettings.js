import React, { useState, useEffect } from 'react';
import api from '../api';
import './PaymentSettings.css';

function PaymentSettings() {
  const [balance, setBalance] = useState(0);
  const [chargeAmount, setChargeAmount] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [chargeHistory, setChargeHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBalance();
    loadChargeHistory();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await api.get('/api/payment/balance');
      if (response.data.success) {
        setBalance(response.data.data.balance || 0);
      }
    } catch (error) {
      console.error('잔액 조회 오류:', error);
    }
  };

  const loadChargeHistory = async () => {
    try {
      const response = await api.get('/api/payment/history');
      if (response.data.success) {
        setChargeHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('충전 내역 조회 오류:', error);
    }
  };

  const handleCharge = async () => {
    if (chargeAmount < 1000) {
      alert('최소 충전 금액은 1,000원입니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/payment/charge', {
        amount: chargeAmount,
        paymentMethod: paymentMethod
      });

      if (response.data.success) {
        // 결제 모듈 호출 (포트원)
        if (response.data.data.paymentData) {
          openPaymentModal(response.data.data.paymentData);
        } else {
          alert('결제 정보를 받아올 수 없습니다.');
        }
      }
    } catch (error) {
      console.error('충전 오류:', error);
      alert('충전에 실패했습니다: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (paymentData) => {
    // 포트원(아임포트) 결제 모듈 연동
    if (window.IMP) {
      // 포트원 가맹점 식별코드 (환경 변수 또는 기본값 사용)
      const IMP_UID = process.env.REACT_APP_IMP_UID || 'store-3c5e5309-e75f-42a4-8569-684a94c70a82';
      
      window.IMP.init(IMP_UID);
      window.IMP.request_pay(paymentData, (rsp) => {
        if (rsp.success) {
          // 결제 성공 - 서버에서 검증
          api.post('/api/payment/verify', { 
            imp_uid: rsp.imp_uid,
            merchant_uid: rsp.merchant_uid,
            amount: rsp.paid_amount
          })
            .then(response => {
              if (response.data.success) {
                alert(`충전이 완료되었습니다.\n충전 금액: ${formatCurrency(response.data.data.chargedAmount)}\n현재 잔액: ${formatCurrency(response.data.data.balance)}`);
                loadBalance();
                loadChargeHistory();
              } else {
                alert('충전 처리 중 오류가 발생했습니다: ' + response.data.error);
              }
            })
            .catch(error => {
              console.error('결제 검증 오류:', error);
              alert('결제 검증 중 오류가 발생했습니다.');
            });
        } else {
          // 결제 실패
          let errorMsg = '결제에 실패했습니다.';
          if (rsp.error_msg) {
            errorMsg += '\n' + rsp.error_msg;
          }
          alert(errorMsg);
          
          // 실패 내역 저장
          api.post('/api/payment/fail', {
            merchant_uid: rsp.merchant_uid,
            error_code: rsp.error_code,
            error_msg: rsp.error_msg
          }).catch(err => console.error('실패 내역 저장 오류:', err));
        }
      });
    } else {
      alert('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const chargeAmounts = [
    { label: '1만원', value: 10000 },
    { label: '3만원', value: 30000 },
    { label: '5만원', value: 50000 },
    { label: '10만원', value: 100000 },
    { label: '30만원', value: 300000 },
    { label: '50만원', value: 500000 }
  ];

  return (
    <div className="payment-settings">
      <div className="payment-header">
        <h1>프렌츠 결제</h1>
        <p>알림톡 발송을 위한 충전 서비스</p>
      </div>

      <div className="payment-content">
        {/* 잔액 표시 */}
        <div className="balance-card">
          <div className="balance-label">현재 잔액</div>
          <div className="balance-amount">{formatCurrency(balance)}</div>
          <div className="balance-description">
            알림톡 발송 시 자동으로 차감됩니다
          </div>
        </div>

        {/* 충전 금액 선택 */}
        <div className="charge-section">
          <h2>충전 금액 선택</h2>
          <div className="charge-amounts-grid">
            {chargeAmounts.map((item) => (
              <button
                key={item.value}
                className={`charge-amount-btn ${chargeAmount === item.value ? 'active' : ''}`}
                onClick={() => setChargeAmount(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="custom-amount-input">
            <label>직접 입력</label>
            <input
              type="number"
              className="form-control"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(parseInt(e.target.value) || 0)}
              min="1000"
              step="1000"
              placeholder="최소 1,000원"
            />
            <span className="input-hint">최소 충전 금액: 1,000원</span>
          </div>
        </div>

        {/* 결제 수단 선택 */}
        <div className="payment-method-section">
          <h2>결제 수단</h2>
          <div className="payment-methods">
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>신용카드</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>계좌이체</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="virtual"
                checked={paymentMethod === 'virtual'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>가상계좌</span>
            </label>
          </div>
        </div>

        {/* 충전 버튼 */}
        <div className="charge-action">
          <button
            className="btn btn-primary btn-large"
            onClick={handleCharge}
            disabled={loading || chargeAmount < 1000}
          >
            {loading ? '처리 중...' : `${formatCurrency(chargeAmount)} 충전하기`}
          </button>
        </div>

        {/* 충전 내역 */}
        <div className="charge-history-section">
          <h2>충전 내역</h2>
          {chargeHistory.length === 0 ? (
            <div className="empty-history">
              충전 내역이 없습니다.
            </div>
          ) : (
            <table className="charge-history-table">
              <thead>
                <tr>
                  <th>충전일시</th>
                  <th>충전금액</th>
                  <th>결제수단</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {chargeHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>{item.payment_method === 'card' ? '신용카드' : item.payment_method === 'bank' ? '계좌이체' : '가상계좌'}</td>
                    <td>
                      <span className={`status-badge ${item.status === 'completed' ? 'success' : item.status === 'pending' ? 'pending' : 'failed'}`}>
                        {item.status === 'completed' ? '완료' : item.status === 'pending' ? '대기' : '실패'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSettings;
