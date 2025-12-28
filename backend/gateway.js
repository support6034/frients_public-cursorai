/**
 * 게이트웨이 서버 (GW)
 * 스마트스토어 API 폴링하여 GTM 트리거 발생
 */

const axios = require('axios');
const db = require('./database');

class SmartStoreGateway {
  constructor() {
    this.pollingInterval = 30000; // 30초
    this.isRunning = false;
    this.lastOrderId = null;
  }

  // 스마트스토어 API 설정 로드
  async loadSettings() {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT integration_config FROM ai_alimbot_settings WHERE industry = 'shopping' ORDER BY updated_at DESC LIMIT 1",
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row && row.integration_config) {
              const config = JSON.parse(row.integration_config);
              resolve(config.smartstore || {});
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  // 디버그 로그 저장 헬퍼 함수
  saveDebugLog(component, direction, action, url, requestData, responseData, status, errorMessage) {
    db.run(
      `INSERT INTO debug_logs (component, direction, action, url, request_data, response_data, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        component,
        direction,
        action,
        url || null,
        requestData ? JSON.stringify(requestData) : null,
        responseData ? JSON.stringify(responseData) : null,
        status || null,
        errorMessage || null
      ],
      (err) => {
        if (err) {
          console.error('디버그 로그 저장 오류:', err);
        }
      }
    );
  }

  // 스마트스토어 주문 조회 API 호출
  async fetchOrders(settings) {
    const apiUrl = `https://api.commerce.naver.com/smartstore/v1/orders`;
    const requestData = {
      headers: {
        'X-Naver-Client-Id': settings.apiKey,
        'X-Naver-Client-Secret': settings.apiSecret
      },
      params: {
        startDate: new Date(Date.now() - 60000).toISOString(),
        endDate: new Date().toISOString()
      }
    };

    try {
      const { apiKey, apiSecret, storeId } = settings;
      
      if (!apiKey || !apiSecret || !storeId) {
        console.log('스마트스토어 연동 설정이 완료되지 않았습니다.');
        this.saveDebugLog('GW', 'OUT', '스마트스토어 API 폴링', apiUrl, requestData, null, 'skipped', '연동 설정 미완료');
        return [];
      }

      // 스마트스토어 오픈API 호출 (예시)
      // 실제 API 엔드포인트와 인증 방식은 스마트스토어 API 문서 참조
      const response = await axios.get(apiUrl, requestData);
      const orders = response.data.orders || [];

      // 성공 로그 저장
      this.saveDebugLog(
        'GW',
        'OUT',
        '스마트스토어 API 폴링',
        apiUrl,
        requestData,
        { status: response.status, orderCount: orders.length, orders: orders.slice(0, 3) }, // 처음 3개만 저장
        'success',
        null
      );

      console.log(`[GW] 스마트스토어 API 폴링 성공: ${orders.length}개 주문 조회`);
      return orders;
    } catch (error) {
      console.error('[GW] 스마트스토어 API 호출 오류:', error.message);
      
      // 실패 로그 저장
      this.saveDebugLog(
        'GW',
        'OUT',
        '스마트스토어 API 폴링',
        apiUrl,
        requestData,
        { status: error.response?.status, statusText: error.response?.statusText },
        'error',
        error.message
      );
      
      return [];
    }
  }

  // GTM 트리거 발생
  async triggerGTM(orderData) {
    const gtmUrl = process.env.GTM_TRIGGER_URL || 'http://localhost:5000/api/events';
    
    // 주문완료 이벤트 데이터 구성
    const eventData = {
      event: '주문완료',
      orderId: orderData.orderId,
      orderDate: orderData.orderDate,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      products: orderData.products,
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
      timestamp: new Date().toISOString()
    };

    try {
      // GTM으로 이벤트 전송
      const response = await axios.post(gtmUrl, eventData);
      
      console.log(`[GW] GTM 트리거 발생: 주문완료 - ${orderData.orderId}`);
      
      // 디버그 로그 저장
      this.saveDebugLog(
        'GW',
        'OUT',
        'GTM 트리거 발생',
        gtmUrl,
        eventData,
        { status: response.status, data: response.data },
        'success',
        null
      );
      
      // 이벤트 로그 저장
      db.run(
        'INSERT INTO event_logs (event_name, event_data) VALUES (?, ?)',
        ['주문완료', JSON.stringify(eventData)],
        (err) => {
          if (err) {
            console.error('이벤트 로그 저장 오류:', err);
          }
        }
      );
    } catch (error) {
      console.error('[GW] GTM 트리거 발생 오류:', error.message);
      
      // 실패 로그 저장
      this.saveDebugLog(
        'GW',
        'OUT',
        'GTM 트리거 발생',
        gtmUrl,
        eventData,
        { status: error.response?.status, statusText: error.response?.statusText },
        'error',
        error.message
      );
    }
  }

  // 폴링 시작
  async startPolling() {
    if (this.isRunning) {
      console.log('게이트웨이 폴링이 이미 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('게이트웨이 폴링 시작...');

    const poll = async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        const settings = await this.loadSettings();
        
        if (!settings || !settings.enabled) {
          console.log('스마트스토어 연동이 비활성화되어 있습니다.');
          setTimeout(poll, this.pollingInterval);
          return;
        }

        // 주문 조회
        const orders = await this.fetchOrders(settings);
        
        // 새로운 주문만 처리
        for (const order of orders) {
          if (order.orderId !== this.lastOrderId) {
            await this.triggerGTM(order);
            this.lastOrderId = order.orderId;
          }
        }
      } catch (error) {
        console.error('폴링 오류:', error);
      }

      // 다음 폴링 예약
      setTimeout(poll, this.pollingInterval);
    };

    // 첫 폴링 시작
    poll();
  }

  // 폴링 중지
  stopPolling() {
    this.isRunning = false;
    console.log('게이트웨이 폴링 중지');
  }
}

// 싱글톤 인스턴스
const gateway = new SmartStoreGateway();

// 서버 시작 시 폴링 시작 (선택사항)
// gateway.startPolling();

module.exports = gateway;

