import requests
import streamlit as st

st.set_page_config(page_title="USD Exchange Rate", page_icon="💱")

st.title("อัตราแลกเปลี่ยนจาก USD")

API_KEY = "ea645c381b6f36c25c51e3ea"

@st.cache_data(ttl=3600)
def get_rates():
    url = f"https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()
    if data.get("result") != "success":
        raise RuntimeError(data.get("error-type", "API request failed"))
    return data["conversion_rates"]

try:
    rates = get_rates()
except Exception as e:
    st.error(f"ไม่สามารถเรียก API ได้: {e}")
    st.stop()

currency = st.selectbox("เลือกสกุลเงินอื่น", ["THB", "JPY", "EUR", "GBP", "AED"])
rate = rates.get(currency)

if rate is not None:
    st.subheader(f"1 USD = {rate:,.2f} {currency}")
    st.write(f"1 USD = {rate:,.2f} {currency}")
else:
    st.error("ไม่พบอัตราแลกเปลี่ยนของสกุลเงินนี้")
