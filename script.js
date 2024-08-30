document.addEventListener('DOMContentLoaded', () => {
    const exercises = [
        { name: 'סקוואט', weight: 42.5, reps: 5, sets: [5, 5, 5, 5, 5] },
        { name: 'לחיצת חזה', weight: 40, reps: 5, sets: [5, 5, 5, 5, 5] },
        { name: 'דדליפט', weight: 95, reps: 5, sets: [5, 5] }
    ];

    const popularExercises = {
        'Squat': { name: 'סקוואט', weight: 42.5, reps: 5 },
        'Bench Press': { name: 'לחיצת חזה', weight: 40, reps: 5 },
        'Deadlift': { name: 'דדליפט', weight: 95, reps: 5 },
        'Overhead Press': { name: 'לחיצת כתפיים', weight: 30, reps: 5 },
        'Barbell Row': { name: 'חתירה עם מוט', weight: 35, reps: 5 },
        'Pull Up': { name: 'מתח', weight: 0, reps: 5 },
        'Dumbbell Curl': { name: 'כפיפת מרפקים עם משקולת', weight: 15, reps: 10 }
    };

    let workoutHistory = loadWorkoutHistory();
    let workoutStartTime = null;
    let timerInterval = null;
    const progressCircle = document.querySelector('.progress-ring__circle');
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    // Load saved weights from cookies
    loadSavedWeights();

    function updateSetReps(exerciseIndex, setIndex) {
        const exercise = exercises[exerciseIndex];
        let currentReps = exercise.sets[setIndex];

        const button = document.querySelectorAll('.exercise')[exerciseIndex]
            .querySelectorAll('.set-button')[setIndex];

        if (currentReps === exercise.reps && !button.classList.contains('clicked')) {
            button.classList.add('clicked');

            if (!workoutStartTime) {
                workoutStartTime = new Date();
            }

            startTimer(); // Start the timer without a set limit

        } else if (currentReps > 0) {
            currentReps -= 1;

            if (currentReps === 0) {
                button.classList.remove('clicked');
            } else {
                button.classList.add('clicked');
            }
        } else {
            currentReps = exercise.reps;
            button.classList.remove('clicked');
        }

        exercise.sets[setIndex] = currentReps;
        button.textContent = currentReps;
    }

    function updateExercise(exerciseIndex, selectedExercise) {
        const exerciseElement = document.querySelectorAll('.exercise')[exerciseIndex];

        const selectedDetails = popularExercises[selectedExercise];
        exercises[exerciseIndex].name = selectedDetails.name;
        exercises[exerciseIndex].weight = selectedDetails.weight;
        exercises[exerciseIndex].reps = selectedDetails.reps;
        exercises[exerciseIndex].sets = Array(exercises[exerciseIndex].sets.length).fill(selectedDetails.reps);

        const buttons = exerciseElement.querySelectorAll('.set-button');
        buttons.forEach(button => {
            button.classList.remove('clicked');
            button.textContent = selectedDetails.reps;
        });

        const weightDisplay = exerciseElement.querySelector('.weight-display');
        weightDisplay.textContent = `${selectedDetails.weight} ק"ג`;

        // Save the updated weight to cookies
        saveWeightsToCookies();
    }

    function updateWeight(exerciseIndex, increment) {
        const exercise = exercises[exerciseIndex];
        const weightDisplay = document.querySelectorAll('.exercise')[exerciseIndex].querySelector('.weight-display');
        let newWeight = exercise.weight + increment;

        newWeight = Math.max(newWeight, 0);

        exercise.weight = newWeight;
        weightDisplay.textContent = `${newWeight} ק"ג`;

        // Save the updated weight to cookies
        saveWeightsToCookies();
    }

    function updateSetCount(exerciseIndex, increment) {
        const exercise = exercises[exerciseIndex];
        let newSetCount = exercise.sets.length + increment;

        // Limit the number of sets to a minimum of 1 and a maximum of 6
        newSetCount = Math.max(1, Math.min(newSetCount, 6));

        exercise.sets = Array(newSetCount).fill(exercise.reps);

        const setButtonsContainer = document.querySelectorAll('.exercise')[exerciseIndex].querySelector('.set-list');
        setButtonsContainer.innerHTML = '';
        for (let i = 0; i < newSetCount; i++) {
            const setButton = document.createElement('button');
            setButton.classList.add('set-button');
            setButton.textContent = exercise.reps;
            setButton.addEventListener('click', () => updateSetReps(exerciseIndex, i));
            setButtonsContainer.appendChild(setButton);
        }
    }

    function startTimer() {
        clearInterval(timerInterval);
        let elapsedTime = 0; // Start at 0 seconds

        updateTimerDisplay(elapsedTime);
        setProgress(0); // Reset progress at the start

        timerInterval = setInterval(() => {
            elapsedTime++;
            updateTimerDisplay(elapsedTime);
            setProgress(elapsedTime / 120); // Assuming the circle fills in 2 minutes (120 seconds)

        }, 1000);
    }

    function updateTimerDisplay(elapsedTime) {
        const timerDisplay = document.getElementById('timer-display');
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function setProgress(percent) {
        const offset = circumference - percent * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    function saveWorkout() {
        if (!workoutStartTime) {
            alert('התחל אימון לפני לחיצה על כפתור סיום אימון.');
            return;
        }

        clearInterval(timerInterval);
        const workoutEndTime = new Date();
        const workoutDuration = Math.floor((workoutEndTime - workoutStartTime) / 1000);
        const minutes = Math.floor(workoutDuration / 60);
        const seconds = workoutDuration % 60;
        const formattedDuration = `${minutes} דקות ו-${seconds} שניות`;

        const workoutData = exercises.map((exercise, exerciseIndex) => {
            const setsDone = exercise.sets.map((reps, setIndex) => {
                const button = document.querySelectorAll('.exercise')[exerciseIndex]
                    .querySelectorAll('.set-button')[setIndex];
                return button.classList.contains('clicked') ? reps : null;
            }).filter(reps => reps !== null);

            return {
                name: exercise.name,
                weight: exercise.weight,
                sets: setsDone
            };
        });

        const workoutDate = workoutEndTime.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' });
        const workoutDetails = {
            date: workoutDate,
            duration: formattedDuration,
            exercises: workoutData
        };

        workoutHistory.push(workoutDetails);
        saveWorkoutHistory(workoutHistory);
        displayWorkoutHistory();

        workoutStartTime = null;
        resetWorkout();
    }

    function resetWorkout() {
        exercises.forEach(exercise => {
            exercise.sets = Array(exercise.sets.length).fill(exercise.reps);
        });

        document.querySelectorAll('.set-button').forEach((button, index) => {
            const exerciseIndex = Math.floor(index / 5);
            const exercise = exercises[exerciseIndex];
            button.classList.remove('clicked');
            button.textContent = exercise.reps;
        });

        updateTimerDisplay(0);
        setProgress(0);
    }

    function displayWorkoutHistory() {
        const historyContainer = document.querySelector('.workout-history');
        historyContainer.innerHTML = '';

        workoutHistory.forEach((workout, index) => {
            const workoutEntry = document.createElement('div');
            workoutEntry.classList.add('workout-entry');
            workoutEntry.innerHTML = `
                <h3>אימון - ${workout.date} - משך: ${workout.duration}</h3>
                <button class="delete-button" data-index="${index}">מחק</button>
            `;

            workout.exercises.forEach(exercise => {
                const totalWeight = exercise.sets.reduce((acc, reps) => acc + (reps * exercise.weight), 0);
                const exerciseInfo = document.createElement('p');
                exerciseInfo.textContent = `${exercise.name}: ${exercise.weight} ק"ג - סטים: ${exercise.sets.join(', ')} - סה"כ משקל: ${totalWeight} ק"ג`;
                workoutEntry.appendChild(exerciseInfo);
            });

            historyContainer.appendChild(workoutEntry);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                workoutHistory.splice(index, 1);
                saveWorkoutHistory(workoutHistory);
                displayWorkoutHistory();
            });
        });
    }

    function saveWorkoutHistory(history) {
        document.cookie = `workoutHistory=${encodeURIComponent(JSON.stringify(history))}; path=/; max-age=31536000`;
    }

    function loadWorkoutHistory() {
        const cookies = document.cookie.split('; ');
        const workoutCookie = cookies.find(cookie => cookie.startsWith('workoutHistory='));
        if (workoutCookie) {
            return JSON.parse(decodeURIComponent(workoutCookie.split('=')[1]));
        }
        return [];
    }

    function saveWeightsToCookies() {
        const weights = exercises.map(exercise => ({ name: exercise.name, weight: exercise.weight }));
        document.cookie = `exerciseWeights=${encodeURIComponent(JSON.stringify(weights))}; path=/; max-age=31536000`;
    }

    function loadSavedWeights() {
        const cookies = document.cookie.split('; ');
        const weightsCookie = cookies.find(cookie => cookie.startsWith('exerciseWeights='));
        if (weightsCookie) {
            const savedWeights = JSON.parse(decodeURIComponent(weightsCookie.split('=')[1]));
            savedWeights.forEach(saved => {
                const exercise = exercises.find(ex => ex.name === saved.name);
                if (exercise) {
                    exercise.weight = saved.weight;
                    const exerciseElement = [...document.querySelectorAll('.exercise')].find(elem => elem.querySelector('.exercise-selector').value === saved.name);
                    if (exerciseElement) {
                        exerciseElement.querySelector('.weight-display').textContent = `${saved.weight} ק"ג`;
                    }
                }
            });
        }
    }

    document.querySelectorAll('.exercise').forEach((exerciseElement, exerciseIndex) => {
        exerciseElement.querySelectorAll('.set-button').forEach((button, setIndex) => {
            button.addEventListener('click', () => {
                updateSetReps(exerciseIndex, setIndex);
            });
        });

        exerciseElement.querySelector('.exercise-selector').addEventListener('change', (event) => {
            updateExercise(exerciseIndex, event.target.value);
        });

        exerciseElement.querySelector('.weight-control .increment').addEventListener('click', () => {
            updateWeight(exerciseIndex, 2.5);
        });

        exerciseElement.querySelector('.weight-control .decrement').addEventListener('click', () => {
            updateWeight(exerciseIndex, -2.5);
        });

        exerciseElement.querySelector('.set-control-button.increment-set').addEventListener('click', () => {
            updateSetCount(exerciseIndex, 1);
        });

        exerciseElement.querySelector('.set-control-button.decrement-set').addEventListener('click', () => {
            updateSetCount(exerciseIndex, -1);
        });
    });

    document.getElementById('end-workout-button').addEventListener('click', saveWorkout);

    displayWorkoutHistory();
});