(function () {
  const categoryColors = {
    'صلاة': { border: '#2C6E2F', bg: '#2C6E2F', label: 'صلاة' },
    'وجبة': { border: '#E67E22', bg: '#E67E22', label: 'وجبة' },
    'موضوع': { border: '#E74C3C', bg: '#E74C3C', label: 'موضوع' },
    'مشغل': { border: '#8E44AD', bg: '#8E44AD', label: 'مشغل' },
    'ألعاب': { border: '#2980B9', bg: '#2980B9', label: 'ألعاب' },
  };

  function toArabicNum(n) {
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    return String(n).replace(/\d/g, d => arabic[parseInt(d)]);
  }

  function formatTime(t) {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length === 2) {
      return parts[0] + ':' + parts[1];
    }
    return t;
  }

  function renderSession(session, day) {
    const catInfo = categoryColors[session.category] || { border: '#95A5A6', bg: '#95A5A6', label: session.category };
    const catClass = 'cat-' + (session.category || 'ألعاب').replace(/\s/g, '_');
    const card = document.createElement('div');
    card.className = 'session-card ' + catClass;
    card.innerHTML =
      '<div class="session-day">' + day + '</div>' +
      '<div class="session-time">' + toArabicNum(formatTime(session.time_start)) + ' – ' + toArabicNum(formatTime(session.time_end)) + '</div>' +
      '<div class="session-name">' + session.activity_name + '</div>' +
      (session.responsible_person ? '<div class="session-person">' + session.responsible_person + '</div>' : '') +
      '<div><span class="category-badge" style="background:' + catInfo.bg + ';color:white;">' + catInfo.label + '</span></div>' +
      (session.notes ? '<div class="session-notes">' + session.notes + '</div>' : '');
    return card;
  }

  var baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';

  fetch(baseUrl + '/api/sessions')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var days = ['الثلاثاء', 'الأربعاء', 'الخميس'];
      days.forEach(function (day) {
        var container = document.getElementById('day-' + day);
        if (!container) return;
        container.innerHTML = '';
        var sessions = data[day] || [];
        if (sessions.length === 0) {
          container.innerHTML = '<div class="empty-day">لا توجد فعاليات لهذا اليوم</div>';
        } else {
          sessions.forEach(function (s) {
            container.appendChild(renderSession(s, day));
          });
        }
      });
    })
    .catch(function () {
      var days = ['الثلاثاء', 'الأربعاء', 'الخميس'];
      days.forEach(function (day) {
        var container = document.getElementById('day-' + day);
        if (container) {
          container.innerHTML = '<div class="empty-day">تعذر تحميل الجدول. تأكد من تشغيل الخادم.</div>';
        }
      });
    });

  // ----- Star rating -----
  var stars = document.querySelectorAll('.star-rating .star');
  var ratingInput = document.getElementById('feedbackRating');
  var goldColor = '#FFB74D';
  var grayColor = '#B8D0D2';

  function updateStars(value) {
    stars.forEach(function (s) {
      var active = parseInt(s.dataset.value) <= value;
      s.textContent = active ? '★' : '☆';
      s.style.color = active ? goldColor : grayColor;
    });
  }

  stars.forEach(function (star) {
    star.addEventListener('click', function () {
      var value = parseInt(this.dataset.value);
      ratingInput.value = value;
      updateStars(value);
    });

    star.addEventListener('mouseenter', function () {
      var value = parseInt(this.dataset.value);
      stars.forEach(function (s) {
        var active = parseInt(s.dataset.value) <= value;
        s.textContent = active ? '★' : '☆';
        s.style.color = active ? goldColor : grayColor;
      });
    });

    star.addEventListener('mouseleave', function () {
      var activeVal = parseInt(ratingInput.value) || 0;
      updateStars(activeVal);
    });
  });

  // ----- Feedback form -----
  var feedbackForm = document.getElementById('feedbackForm');
  var feedbackSuccess = document.getElementById('feedbackSuccess');

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('feedbackName').value.trim();
      var message = document.getElementById('feedbackMessage').value.trim();
      var rating = parseInt(document.getElementById('feedbackRating').value) || 0;

      if (!message) {
        alert('الرجاء كتابة ملاحظاتك.');
        return;
      }

      var btn = feedbackForm.querySelector('.btn-submit');
      btn.disabled = true;
      btn.textContent = 'جاري الإرسال...';

      var baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';
      fetch(baseUrl + '/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, message: message, rating: rating })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          feedbackForm.style.display = 'none';
          feedbackSuccess.style.display = 'block';
          feedbackSuccess.textContent = 'شكراً لملاحظاتك! 🙏';
        })
        .catch(function () {
          alert('تعذر إرسال الملاحظات. حاول مرة أخرى.');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'إرسال';
        });
    });
  }

  // ----- Registration form -----
  var registerForm = document.getElementById('registerForm');
  var registerSuccess = document.getElementById('registerSuccess');

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('regName').value.trim();
      var phone = document.getElementById('regPhone').value.trim();
      var age = document.getElementById('regAge').value.trim();
      var notes = document.getElementById('regNotes').value.trim();

      if (!name || !phone) {
        alert('الرجاء إدخال الاسم ورقم الهاتف.');
        return;
      }

      var btn = registerForm.querySelector('.btn-submit');
      btn.disabled = true;
      btn.textContent = 'جاري التسجيل...';

      var baseUrl = typeof API_URL !== 'undefined' ? API_URL : '';
      fetch(baseUrl + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, age: age, notes: notes })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          registerForm.style.display = 'none';
          registerSuccess.style.display = 'block';
          registerSuccess.textContent = 'تم التسجيل بنجاح! ✅';
        })
        .catch(function () {
          alert('تعذر إتمام التسجيل. حاول مرة أخرى.');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'تسجيل';
        });
    });
  }
})();
