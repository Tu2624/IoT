<template>
  <div class="profile-layout">
    <!-- ===== LEFT: AVATAR CARD ===== -->
    <div class="left-card">
      <div class="avatar-wrap">
        <img src="https://i.pravatar.cc/150?img=68" alt="avatar" class="avatar-img" />
        <div class="avatar-ring"></div>
      </div>
      <h2 class="profile-name">Vũ Đình Tú</h2>
      <span class="role-badge">Administrator</span>
      <div class="divider"></div>
      <div class="contact-row">
        <span class="contact-icon">✉️</span>
        <span class="contact-text">TuVD.B22PT244@stu.ptit.edu.vn</span>
      </div>
      <div class="contact-row">
        <span class="contact-icon">👤</span>
        <span class="contact-text">0123456789</span>
      </div>
    </div>

    <!-- ===== RIGHT: INFO CARDS ===== -->
    <div class="right-section">
      <!-- Student Info -->
      <div class="info-card">
        <div class="card-title">
          <span class="title-icon">👤</span>
          <span>Thông tin sinh viên</span>
        </div>
        <div class="info-grid">
          <div class="info-field">
            <div class="field-label">Mã sinh viên</div>
            <div class="field-value">B22DCPT244</div>
          </div>
          <div class="info-field">
            <div class="field-label">Ngày tháng năm sinh</div>
            <div class="field-value">02/06/2004</div>
          </div>
          <div class="info-field info-field--full">
            <div class="field-label">Mã lớp</div>
            <div class="field-value">D22DPTPT02</div>
          </div>
        </div>
      </div>

      <!-- Report Card -->
      <div class="info-card">
        <div class="card-title">
          <span class="title-icon">📦</span>
          <span>Báo cáo bài tập lớn</span>
        </div>
        <div class="report-list">
          <div class="report-row">
            <span class="report-icon">🐙</span>
            <span class="report-label">Github:</span>
            <span class="report-line"></span>
          </div>
          <div class="report-row">
            <span class="report-icon">🎨</span>
            <span class="report-label">Figma:</span>
            <span class="report-line"></span>
          </div>
          <div class="report-row">
            <span class="report-icon">📄</span>
            <span class="report-label">Báo cáo Pdf:</span>
            <span class="report-line"></span>
          </div>
          <div class="report-row">
            <span class="report-icon">📋</span>
            <span class="report-label">Api docs:</span>
            <span class="report-line"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.profile-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

/* ===== LEFT CARD ===== */
.left-card {
  background: rgba(17,32,85,0.5);
  border: 1px solid rgba(30,58,110,0.5);
  border-radius: var(--radius-card);
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}
.left-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  border-color: rgba(30,136,229,0.4);
}

.avatar-wrap {
  position: relative;
  width: 130px;
  height: 130px;
}
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(30,136,229,0.5);
  transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}
.avatar-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid rgba(30,136,229,0.2);
  transition: border-color 0.3s ease, transform 0.3s ease;
}
.left-card:hover .avatar-img {
  border-color: rgba(30,136,229,0.9);
  transform: scale(1.05);
}
.left-card:hover .avatar-ring {
  border-color: rgba(30,136,229,0.5);
  transform: scale(1.08);
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  text-align: center;
  transition: color 0.2s ease;
}
.left-card:hover .profile-name { color: #6bb8ff; }

.role-badge {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  font-weight: 500;
}

.divider {
  width: 100%;
  height: 1px;
  background: rgba(30,58,110,0.6);
  margin: 4px 0;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 10px 14px;
  transition: background 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;
}
.contact-row:hover {
  background: rgba(30,136,229,0.12);
  transform: translateX(4px);
}
.contact-icon { font-size: 16px; flex-shrink: 0; }
.contact-text {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  word-break: break-all;
}

/* ===== RIGHT SECTION ===== */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: rgba(17,32,85,0.5);
  border: 1px solid rgba(30,58,110,0.5);
  border-radius: var(--radius-card);
  padding: 28px 32px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}
.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  border-color: rgba(30,136,229,0.35);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24px;
}
.title-icon {
  font-size: 22px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.info-card:hover .title-icon { transform: scale(1.2) rotate(-5deg); }

/* Student info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.info-field--full { grid-column: 1 / -1; }

.field-label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 6px;
  font-weight: 500;
  letter-spacing: 0.3px;
}
.field-value {
  background: rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  transition: background 0.2s ease, transform 0.2s ease;
}
.field-value:hover {
  background: rgba(30,136,229,0.15);
  transform: scale(1.01);
}

/* Report list */
.report-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.report-row {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;
}
.report-row:hover { transform: translateX(6px); }
.report-icon {
  font-size: 18px;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.report-row:hover .report-icon { transform: scale(1.25); }
.report-label {
  font-size: 15px;
  color: rgba(255,255,255,0.8);
  font-weight: 500;
  min-width: 120px;
  flex-shrink: 0;
}
.report-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.35);
  border-radius: 1px;
  transition: background 0.2s ease;
}
.report-row:hover .report-line { background: rgba(30,136,229,0.6); }
</style>
