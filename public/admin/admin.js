(function () {
  var API = typeof API_URL !== 'undefined' ? API_URL : '';
  var token = localStorage.getItem('schedule_token');

  var loginSection = document.getElementById('loginSection');
  var dashboardSection = document.getElementById('dashboardSection');

  function toArabicNum(n) {
    var arabic = '٠١٢٣٤٥٦٧٨٩';
    return String(n).replace(/\d/g, function (d) { return arabic[parseInt(d)]; });
  }

  function showSuccess(msg) {
    var el = document.getElementById('successMsg');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  function checkAuth() {
    if (token) {
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      loadSessions();
      loadFeedback();
      loadRegistrations();
    } else {
      loginSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
    }
  }

  // ----- Login -----
  document.getElementById('loginBtn').addEventListener('click', function () {
    var username = document.getElementById('usernameInput').value.trim();
    var password = document.getElementById('passwordInput').value;
    var errorEl = document.getElementById('loginError');

    if (!username || !password) {
      errorEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة السر.';
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'جاري التحقق...';

    fetch(API + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.token) {
          token = data.token;
          localStorage.setItem('schedule_token', token);
          checkAuth();
        } else {
          errorEl.textContent = data.error || 'بيانات الدخول غير صحيحة.';
          errorEl.style.display = 'block';
        }
      })
      .catch(function () {
        errorEl.textContent = 'تعذر الاتصال بالخادم.';
        errorEl.style.display = 'block';
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'دخول';
      });
  });

  document.getElementById('passwordInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
  document.getElementById('usernameInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });

  // ----- Logout -----
  // ----- Toggle Password -----
  var toggleBtn = document.getElementById('togglePassword');
  var passwordInput = document.getElementById('passwordInput');
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', function () {
      var type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem('schedule_token');
    token = null;
    checkAuth();
  });

  // ----- Tab Switching -----
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
  });

  // ----- Reset Form -----
  function resetForm() {
    document.getElementById('editId').value = '';
    document.getElementById('sessionDay').value = 'الثلاثاء';
    document.getElementById('sessionTimeStart').value = '09:00';
    document.getElementById('sessionTimeEnd').value = '10:00';
    document.getElementById('sessionName').value = '';
    document.getElementById('sessionCategory').value = 'صلاة';
    document.getElementById('formTitle').textContent = '➕ إضافة فعالية جديدة';
    document.getElementById('saveBtn').textContent = '💾 حفظ';
    document.getElementById('cancelBtn').style.display = 'none';
  }

  document.getElementById('cancelBtn').addEventListener('click', resetForm);

  // ----- Save (Create / Update) -----
  document.getElementById('saveBtn').addEventListener('click', function () {
    var editId = document.getElementById('editId').value;
    var day = document.getElementById('sessionDay').value;
    var dateMap = { 'الثلاثاء': '25', 'الأربعاء': '26', 'الخميس': '27' };
    var date = dateMap[day] || '25';
    var time_start = document.getElementById('sessionTimeStart').value;
    var time_end = document.getElementById('sessionTimeEnd').value;
    var activity_name = document.getElementById('sessionName').value.trim();
    var category = document.getElementById('sessionCategory').value;

    if (!activity_name) {
      alert('الرجاء إدخال اسم النشاط.');
      return;
    }

    var body = {
      day: day,
      date: date,
      time_start: time_start,
      time_end: time_end,
      activity_name: activity_name,
      category: category
    };

    var url = API + '/api/admin/sessions';
    var method = 'POST';

    if (editId) {
      url += '/' + editId;
      method = 'PUT';
    }

    var btn = this;
    btn.disabled = true;
    btn.textContent = 'جاري الحفظ...';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('فشل الحفظ');
        return r.json();
      })
      .then(function () {
        showSuccess(editId ? '✅ تم تحديث الفعالية بنجاح' : '✅ تم إضافة الفعالية بنجاح');
        resetForm();
        loadSessions();
      })
      .catch(function (err) {
        alert(err.message);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = editId ? '💾 تحديث' : '💾 حفظ';
      });
  });

  // ----- Load Sessions -----
  function loadSessions() {
    var tbody = document.getElementById('sessionsBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">جاري التحميل...</td></tr>';

    fetch(API + '/api/admin/sessions', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (r) {
        if (r.status === 401) {
          localStorage.removeItem('schedule_token');
          token = null;
          checkAuth();
          throw new Error('انتهت الجلسة');
        }
        return r.json();
      })
      .then(function (sessions) {
        if (sessions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-text">لا توجد فعاليات بعد. أضف الفعالية الأولى!</td></tr>';
          return;
        }
        var html = '';
        var dayOrder = { 'الثلاثاء': 1, 'الأربعاء': 2, 'الخميس': 3 };
        sessions.sort(function (a, b) {
          var da = dayOrder[a.day] || 0;
          var db = dayOrder[b.day] || 0;
          if (da !== db) return da - db;
          return a.time_start.localeCompare(b.time_start);
        });

        sessions.forEach(function (s, i) {
          var catColors = {
            'صلاة': '#2C6E2F',
            'وجبة': '#E67E22',
            'مشغل': '#8E44AD',
            'موضوع': '#E74C3C',
            'ألعاب': '#2980B9'
          };
          var color = catColors[s.category] || '#95A5A6';
          html += '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + s.day + '</td>' +
            '<td>' + s.time_start + ' – ' + s.time_end + '</td>' +
            '<td><strong>' + s.activity_name + '</strong></td>' +
            '<td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + color + ';margin-left:0.3rem;vertical-align:middle;"></span>' + s.category + '</td>' +
            '<td>' +
              '<div class="inline-flex">' +
                '<button class="dash-btn primary small edit-btn" data-id="' + s.id + '">✏️ تعديل</button>' +
                '<button class="dash-btn danger small delete-btn" data-id="' + s.id + '">🗑️ حذف</button>' +
              '</div>' +
            '</td>' +
          '</tr>';
        });
        tbody.innerHTML = html;

        // Edit buttons
        tbody.querySelectorAll('.edit-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.id;
            fetch(API + '/api/admin/sessions', {
              headers: { 'Authorization': 'Bearer ' + token }
            })
              .then(function (r) { return r.json(); })
              .then(function (sessions) {
                var s = sessions.find(function (x) { return x.id == id; });
                if (!s) return;
                document.getElementById('editId').value = s.id;
                document.getElementById('sessionDay').value = s.day;
                document.getElementById('sessionTimeStart').value = s.time_start;
                document.getElementById('sessionTimeEnd').value = s.time_end;
                document.getElementById('sessionName').value = s.activity_name;
                document.getElementById('sessionCategory').value = s.category;
                document.getElementById('formTitle').textContent = '✏️ تعديل: ' + s.activity_name;
                document.getElementById('saveBtn').textContent = '💾 تحديث';
                document.getElementById('cancelBtn').style.display = 'inline-block';
                document.querySelector('[data-tab="add"]').click();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });
          });
        });

        // Delete buttons
        tbody.querySelectorAll('.delete-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.id;
            if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
            fetch(API + '/api/admin/sessions/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            })
              .then(function (r) {
                if (!r.ok) throw new Error('فشل الحذف');
                return r.json();
              })
              .then(function () {
                showSuccess('✅ تم حذف الفعالية بنجاح');
                loadSessions();
              })
              .catch(function (err) { alert(err.message); });
          });
        });
      })
      .catch(function (err) {
        if (err.message !== 'انتهت الجلسة') {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-text">تعذر تحميل الفعاليات.</td></tr>';
        }
      });
  }

  document.getElementById('refreshBtn').addEventListener('click', loadSessions);

  // ----- Feedback -----
  function loadFeedback() {
    var tbody = document.getElementById('feedbackBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">جاري التحميل...</td></tr>';

    fetch(API + '/api/admin/feedback', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (r) {
        if (r.status === 401) {
          localStorage.removeItem('schedule_token');
          token = null;
          checkAuth();
          throw new Error('انتهت الجلسة');
        }
        return r.json();
      })
      .then(function (list) {
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-text">لا توجد ملاحظات بعد.</td></tr>';
          return;
        }
        var html = '';
        list.slice().reverse().forEach(function (f, i) {
          var stars = '';
          for (var s = 0; s < 5; s++) {
            stars += s < f.rating ? '★' : '☆';
          }
          html += '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + (f.name || 'بدون اسم') + '</td>' +
            '<td style="color:var(--accent-bright);font-size:1.1rem;">' + stars + '</td>' +
            '<td>' + f.message + '</td>' +
            '<td>' + new Date(f.createdAt).toLocaleDateString('ar-LB') + '</td>' +
            '<td><button class="dash-btn danger small delete-feedback-btn" data-id="' + f.id + '">🗑️ حذف</button></td>' +
          '</tr>';
        });
        tbody.innerHTML = html;

        tbody.querySelectorAll('.delete-feedback-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.id;
            if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;
            fetch(API + '/api/admin/feedback/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            })
              .then(function (r) {
                if (!r.ok) throw new Error('فشل الحذف');
                return r.json();
              })
              .then(function () {
                showSuccess('✅ تم حذف الملاحظة بنجاح');
                loadFeedback();
              })
              .catch(function (err) { alert(err.message); });
          });
        });
      })
      .catch(function (err) {
        if (err.message !== 'انتهت الجلسة') {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-text">تعذر تحميل الملاحظات.</td></tr>';
        }
      });
  }

  var refreshFeedbackBtn = document.getElementById('refreshFeedbackBtn');
  if (refreshFeedbackBtn) {
    refreshFeedbackBtn.addEventListener('click', loadFeedback);
  }

  // ----- Registrations -----
  function loadRegistrations() {
    var tbody = document.getElementById('registrationsBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="loading-text">جاري التحميل...</td></tr>';

    fetch(API + '/api/admin/registrations', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (r) {
        if (r.status === 401) {
          localStorage.removeItem('schedule_token');
          token = null;
          checkAuth();
          throw new Error('انتهت الجلسة');
        }
        return r.json();
      })
      .then(function (list) {
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="empty-text">لا توجد تسجيلات بعد.</td></tr>';
          return;
        }
        var html = '';
        list.slice().reverse().forEach(function (r, i) {
          html += '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + r.name + '</td>' +
            '<td dir="ltr" style="text-align:right;">' + r.phone + '</td>' +
            '<td>' + (r.age || '-') + '</td>' +
            '<td>' + (r.notes || '-') + '</td>' +
            '<td>' + new Date(r.createdAt).toLocaleDateString('ar-LB') + '</td>' +
            '<td><button class="dash-btn danger small delete-reg-btn" data-id="' + r.id + '">🗑️ حذف</button></td>' +
          '</tr>';
        });
        tbody.innerHTML = html;

        tbody.querySelectorAll('.delete-reg-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.dataset.id;
            if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return;
            fetch(API + '/api/admin/registrations/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            })
              .then(function (r) {
                if (!r.ok) throw new Error('فشل الحذف');
                return r.json();
              })
              .then(function () {
                showSuccess('✅ تم حذف التسجيل بنجاح');
                loadRegistrations();
              })
              .catch(function (err) { alert(err.message); });
          });
        });
      })
      .catch(function (err) {
        if (err.message !== 'انتهت الجلسة') {
          tbody.innerHTML = '<tr><td colspan="7" class="empty-text">تعذر تحميل التسجيلات.</td></tr>';
        }
      });
  }

  var refreshRegBtn = document.getElementById('refreshRegBtn');
  if (refreshRegBtn) {
    refreshRegBtn.addEventListener('click', loadRegistrations);
  }

  checkAuth();
})();
