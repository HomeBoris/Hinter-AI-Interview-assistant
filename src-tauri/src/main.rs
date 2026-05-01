#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, PhysicalPosition};
use std::time::{Duration, Instant};
use std::thread;
use std::sync::{Arc, Mutex};

// Команды управления из интерфейса
#[tauri::command]
fn close_app(window: tauri::Window) { window.close().unwrap(); }
#[tauri::command]
fn minimize_app(window: tauri::Window) { window.minimize().unwrap(); }
#[tauri::command]
fn resize_app(window: tauri::Window, height: f64) {
    window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 800.0, height })).unwrap();
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let win_clone = window.clone();
            
            // Таймер, который запоминает, когда окно двигали в последний раз
            let last_move = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(10)));
            let last_move_clone = Arc::clone(&last_move);

            // Запускаем фоновый поток, который не боится заморозки Windows
            thread::spawn(move || {
                loop {
                    thread::sleep(Duration::from_millis(50));
                    
                    let elapsed = last_move_clone.lock().unwrap().elapsed();
                    
                    // Если окно стояло на месте 150 миллисекунд (пользователь отпустил кнопку мыши)
                    if elapsed > Duration::from_millis(150) && elapsed < Duration::from_millis(500) {
                        
                        // Проверяем, не вылезло ли окно за границы экрана
                        if let Ok(false) = win_clone.is_minimized() {
                            if let Ok(Some(monitor)) = win_clone.current_monitor() {
                                if let Ok(win_size) = win_clone.outer_size() {
                                    if let Ok(win_pos) = win_clone.outer_position() {
                                        let mon_pos = monitor.position();
                                        let mon_size = monitor.size();
                                        
                                        let min_x = mon_pos.x;
                                        let min_y = mon_pos.y;
                                        let max_x = mon_pos.x + mon_size.width as i32 - win_size.width as i32;
                                        let max_y = mon_pos.y + mon_size.height as i32 - win_size.height as i32;

                                        let mut target_x = win_pos.x;
                                        let mut target_y = win_pos.y;
                                        let mut clamped = false;

                                        if target_x < min_x { target_x = min_x; clamped = true; }
                                        if target_x > max_x { target_x = max_x; clamped = true; }
                                        if target_y < min_y { target_y = min_y; clamped = true; }
                                        if target_y > max_y { target_y = max_y; clamped = true; }

                                        // Если вылезло — запускаем плавную анимацию
                                        if clamped {
                                            let win_anim = win_clone.clone();
                                            let start_x = win_pos.x as f32;
                                            let start_y = win_pos.y as f32;
                                            let end_x = target_x as f32;
                                            let end_y = target_y as f32;

                                            thread::spawn(move || {
                                                let duration = Duration::from_millis(250); // Скорость возврата
                                                let start_time = Instant::now();

                                                while start_time.elapsed() < duration {
                                                    let t = start_time.elapsed().as_secs_f32() / duration.as_secs_f32();
                                                    // Формула плавности (Ease-out)
                                                    let ease_out = 1.0 - (1.0 - t).powi(3);

                                                    let cur_x = start_x + (end_x - start_x) * ease_out;
                                                    let cur_y = start_y + (end_y - start_y) * ease_out;

                                                    let _ = win_anim.set_position(tauri::Position::Physical(PhysicalPosition {
                                                        x: cur_x.round() as i32,
                                                        y: cur_y.round() as i32,
                                                    }));

                                                    thread::sleep(Duration::from_millis(16)); // 60 FPS
                                                }
                                                // Точно ставим на край
                                                let _ = win_anim.set_position(tauri::Position::Physical(PhysicalPosition {
                                                    x: target_x as i32,
                                                    y: target_y as i32,
                                                }));
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        // Сдвигаем таймер, чтобы анимация сработала только один раз
                        *last_move_clone.lock().unwrap() = Instant::now() - Duration::from_secs(10);
                    }
                }
            });

            // Ловим каждый сдвиг окна и обновляем таймер
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::Moved(_) = event {
                    *last_move.lock().unwrap() = Instant::now();
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![close_app, minimize_app, resize_app])
        .run(tauri::generate_context!())
        .expect("Ошибка при запуске приложения Tauri");
}