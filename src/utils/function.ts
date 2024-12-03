import axios from "axios"
import { translate } from "free-translate"


let googledistance_key = process.env.GOOGLE_DISTANCE_API_KEY || "AIzaSyB0V1g5YyGB_NE1Lw1QitZZGECA5-1Xnng"



export const convert_degrees_To_radians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
}

export const calculate_distance_between_coordinates = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const earthRadiusInKm = 6371;
    const deltaLatitude = convert_degrees_To_radians(lat2 - lat1);
    const deltaLongitude = convert_degrees_To_radians(lon2 - lon1);
    const a =
        Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
        Math.cos(convert_degrees_To_radians(lat1)) *
        Math.cos(convert_degrees_To_radians(lat2)) *
        Math.sin(deltaLongitude / 2) *
        Math.sin(deltaLongitude / 2);

    const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusInKm * centralAngle;
    return distance;
}

export const calculate_age = (dateString: string): number => {
    const [day, month, year] = dateString.split("/").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassedThisYear =
        currentDate.getMonth() > birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() >= birthDate.getDate());
    if (!hasBirthdayPassedThisYear) {
        age--;
    }
    return age;
}

export const distance_checker = (units: string, origins: any, destinations: any) => {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GOOGLE_DISTANCE_API_KEY || googledistance_key;
        const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origins}&destinations=${destinations}&key=${apiKey}`;
        axios.get(apiUrl)
            .then((response) => {
                const distanceObj = response.data?.rows[0]?.elements[0];

                if (distanceObj?.distance) {
                    const distanceValue = distanceObj.distance.value;
                    const distanceText = distanceObj.distance.text;

                    resolve({ distance: distanceText, distanceValue });
                } else {
                    resolve("No distance information available.");
                }
            })
            .catch((error) => {
                console.error("Error fetching distance:", error.message || error);
            });
    });
}

export const generate_password = (len: number) => {
    let password = "";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "1234567890";
    const special = "!@#$%&";
    const allChars = lowercase + uppercase + digits + special;
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += digits.charAt(Math.floor(Math.random() * digits.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    for (let i = password.length; i < len; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    return password;
}

// export const language_converter = async (text: string, targetLanguage: string) => {
//     try {
//         if (typeof Intl.DisplayNames === "function") {
//             const displayNames = new Intl.DisplayNames(['hi'], { type: 'language' });
//             const code = { lang: 'fr' };

//             const languagesWithNames = {
//                 code: code.lang,
//                 name: displayNames.of(code.lang) 
//             };
//             console.log(languagesWithNames);
//         } else {
//             console.error("Intl.DisplayNames is not supported in this environment.");
//         }
//     } catch (error: any) {
//         console.error('Translation error:', error);
//     }
// }

export const language_converter = async (text: string, from: any, to: any) => {
    try {
        const translatedText = await translate(text, { from: from, to: to });
        return translatedText;
    } catch (error: any) {
        console.error('Translation error:', error);
    }
}




