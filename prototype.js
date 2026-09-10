const patients = [
    {
        id: 1,
        name: "Maya",
        age: 13,
        priority: "URGENT",
        arrivalTime: 1,
        estimatedTreatmentTime: 20,
        needsBed: true,
        needsOperatingRoom: true
    },
    {
        id: 2,
        name: "Brinda",
        age: 28,
        priority: "URGENT",
        arrivalTime: 11,
        estimatedTreatmentTime: 20,
        needsBed: true,
        needsOperatingRoom: true
    },
    {
        id: 3,
        name: "Abby",
        age: 32,
        priority: "URGENT",
        arrivalTime: 11,
        estimatedTreatmentTime: 32,
        needsBed: true,
        needsOperatingRoom: true
    },
    {
        id: 4,
        name: "Scot",
        age: 54,
        priority: "NORMAL",
        arrivalTime: 13,
        estimatedTreatmentTime: 67,
        needsBed: false,
        needsOperatingRoom: false
    },
    {
        id: 5,
        name: "Meowster",
        age: 2,
        priority: "EMERGENCY",
        arrivalTime: 22,
        estimatedTreatmentTime: 50,
        needsBed: true,
        needsOperatingRoom: false
    },
    {
        id: 6,
        name: "Dogman",
        age: 18,
        priority: "NORMAL",
        arrivalTime: 36,
        estimatedTreatmentTime: 10,
        needsBed: false,
        needsOperatingRoom: false
    },
    {
        id: 7,
        name: "Trina",
        age: 67,
        priority: "URGENT",
        arrivalTime: 37,
        estimatedTreatmentTime: 40,
        needsBed: true,
        needsOperatingRoom: true
    },
    {
        id: 8,
        name: "Lee",
        age: 31,
        priority: "EMERGENCY",
        arrivalTime: 40,
        estimatedTreatmentTime: 60,
        needsBed: true,
        needsOperatingRoom: true
    }
];

const needsOperatingRoom = patients.filter(element => {
    return element.needsOperatingRoom === true;
});

console.log("Needs an operating room?")
console.log(needsOperatingRoom)

const emergency = patients.filter(element => {
    return element.priority === "EMERGENCY";
});

console.log(emergency)

const locate = patients.find(element => {
    return element.id === 5;
});

console.log("Searching for patient...")
console.log(locate)

let averageTreatmentTime = 0;

for (let i = 0 ; i < patients.length; i++) {
    averageTreatmentTime += patients[i].estimatedTreatmentTime;
}

averageTreatmentTime = averageTreatmentTime / patients.length;

const currentTime = 50;

console.log("Average treatment time: ", averageTreatmentTime)

let emergencyMostNeeded = 100;
let emergencyName = 'placeholder';

for (let i = 0 ; i < emergency.length; i++) {
    if (emergency[i].arrivalTime < emergencyMostNeeded) {
        emergencyMostNeeded = emergency[i].arrivalTime;
        emergencyName = emergency[i].name;
    }
}

console.log("This emergency status patient has waited the longest:", emergencyName);

const missingPatient = patients.find(element => {
    return element.id === 100;
});

console.log(missingPatient);
