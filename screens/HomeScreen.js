import { View, Text, SafeAreaView, Image, TextInput, TouchableOpacity, ScrollView } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";
import { CalendarDaysIcon, MagnifyingGlassIcon, MapPinIcon } from 'react-native-heroicons/outline';
import { debounce } from "lodash";
import { fetchLocations, fetchWeatherForecast } from '../api/weather'
import { weatherImages } from "../constants";
import * as Progress from 'react-native-progress';
import { getData, storeData } from '../utils/asyncStorage';

export default function HomeScreen() {
    const [showSearch, toggleSearch] = useState(false);
    const [locations, setLocation] = useState([]);
    const [weather, setWeather] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleLocation = (loc) => {
        // console.log("location: ", loc);
        setLocation([]);
        toggleSearch(false);
        setLoading(true);
        fetchWeatherForecast({
            cityName: loc.name,
            days: '7'
        }).then(data => {
            setWeather(data);
            setLoading(false);
            storeData('city', loc.name)
            // console.log("got forecast: ", data);
        })
    }

    const handleSearch = value => {
        //FETCH LOCATIONS
        if (value.length > 2) {
            fetchLocations({ cityName: value }).then(data => {
                setLocation(data);
            })
        }
    }

    useEffect(() => {
        fetchMyWeatherData();
    }, []);

    const fetchMyWeatherData = async () => {
        let myCity = await getData('city');
        let cityName = 'Viet Name';
        if (myCity) cityName = myCity;
        fetchWeatherForecast({
            cityName,
            days: '7'
        }).then(data => {
            setWeather(data);
            setLoading(false)
        })
    }
    const handleTextDebounce = useCallback(debounce(handleSearch, 1200), [])

    const { location } = weather;

    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedDayWeather, setSelectedDayWeather] = useState(null);

    const handleDaily = (index) => {
        setSelectedDayIndex(index);
        setSelectedDayWeather(weather?.forecast?.forecastday[index]?.day || null);
    };
    useEffect(() => {
        setSelectedDayWeather(weather?.forecast?.forecastday[selectedDayIndex]?.day || null);
    }, [weather, selectedDayIndex]);

    return (
        <View className="flex-1 relative">
            <StatusBar style="light" />
            <Image blurRadius={70} source={require('../assets/images/bg.png')} className="absolute h-full w-full"
            />
            {
                loading ? (
                    <View className="flex-1 flex-row justify-center items-center">
                        <Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" duration={2000} />
                        {/* <Text className="text-white text-4xl">Loading...</Text> */}
                    </View>
                ) : (<SafeAreaView className="flex flex-1">
                    {/* Search Sections */}
                    <View style={{ height: '7%' }} className="mx-4 relative z-50">
                        <View className="flex-row justify-end items-center rounded-full"
                            style={{ backgroundColor: showSearch ? theme.bgWhite(0.2) : 'transparent' }}>
                            {
                                showSearch ? (
                                    <TextInput
                                        onChangeText={handleTextDebounce}
                                        placeholder='Search city'
                                        placeholderTextColor={'lightgray'}
                                        className="pl-6 h-10 pb-1 flex-1 text-base text-white">
                                    </TextInput>
                                ) : null
                            }
                            <TouchableOpacity
                                onPress={() => toggleSearch(!showSearch)}
                                style={{ backgroundColor: theme.bgWhite(0.3) }}
                                className="rounded-full p-3 m-1"
                            >
                                <MagnifyingGlassIcon color="white" size="25" />
                            </TouchableOpacity>
                        </View>
                        {
                            locations.length > 0 && showSearch ? (
                                <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                                    {
                                        locations.map((loc, index) => {
                                            let showBorder = index + 1 != locations.length;
                                            let borderClass = showBorder ? 'border-b-2 border-b-gray-400' : '';
                                            return (
                                                <TouchableOpacity
                                                    onPress={() => handleLocation(loc)}
                                                    key={index}
                                                    className={"flex-row items-center border-0 p-3 px-4 mb-1" + borderClass}>
                                                    <MapPinIcon size={25} color="gray"></MapPinIcon>
                                                    <Text className="text-black text-lg ml-2">{loc?.name}, {loc?.country}</Text>
                                                </TouchableOpacity>
                                            )
                                        })
                                    }
                                </View>
                            ) : null
                        }
                    </View>

                    {/* WEATHER SECTIONS */}
                    <View className="mx-4 flex justify-around flex-1 mb-2">
                        {/* LOCATION PARTS */}
                        <Text className="text-white text-center text-2xl font-bold">
                            {location?.name},
                            <Text className="text-lg font-semibold text-gray-300">
                                {" " + location?.country}
                            </Text>
                        </Text>

                        {/* WEATHER IMAGE */}
                        <View className="flex-row justify-center">
                            <Image
                                source={weatherImages[selectedDayWeather?.condition?.text]}
                                // source={{ uri: 'https:' + current?.condition?.icon }}
                                className="w-52 h-52"
                            />
                        </View>

                        {/* DEGREE & DESCRIPTION */}
                        <View className="space-y-2">
                            <Text className="text-center font-bold text-white text-6xl ml-5">
                                {selectedDayWeather?.avgtemp_c}&#176;
                            </Text>

                            <Text className="text-center text-white text-xl tracking-widest">
                                {selectedDayWeather?.condition?.text}
                            </Text>
                        </View>

                        {/* OTHER STATS */}
                        <View className="flex-row justify-between mx-4">
                            {/* WIND STAT */}
                            <View className="flex-row space-x-2 items-center">
                                <Image source={require('../assets/icons/wind.png')} className="h-6 w-6" />
                                <Text className="text-white font-semibold text-base">
                                    {selectedDayWeather?.maxwind_kph}km/h
                                </Text>
                            </View>

                            {/* HUMIDITY STAT */}
                            <View className="flex-row space-x-2 items-center">
                                <Image source={require('../assets/icons/drop.png')} className="h-6 w-6" />
                                <Text className="text-white font-semibold text-base">
                                    {selectedDayWeather?.avghumidity}%
                                </Text>
                            </View>

                            {/* SUNRISE TIME */}
                            <View className="flex-row space-x-2 items-center">
                                <Image source={require('../assets/icons/sun.png')} className="h-6 w-6" />
                                <Text className="text-white font-semibold text-base">
                                    {weather?.forecast?.forecastday[selectedDayIndex]?.astro?.sunrise}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* NEXT DAYS SECTIONS */}
                    <View className="mb-2 space-y-3">
                        <View className="flex-row items-center mx-5 space-x-2">
                            <CalendarDaysIcon size="22" color="white" />
                            <Text className="text-white text-base"> Daily weather</Text>
                        </View>

                        <ScrollView
                            horizontal
                            contentContainerStyle={{ paddingHorizontal: 15 }}
                            showsHorizontalScrollIndicator={false}
                        >
                            {
                                weather?.forecast?.forecastday.map((item, index) => {
                                    let date = new Date(item.date);
                                    let options = { weekday: 'long' }
                                    let dayName = date.toLocaleDateString('en-US', options);
                                    dayName = dayName.split(',')[0]
                                    return (
                                        <TouchableOpacity
                                            onPress={() => handleDaily(index)} // Call the handleDaily function with the index
                                            key={index}
                                            className={`flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4 ${index === selectedDayIndex ? 'border-2 border-white' : ''}`}
                                            style={{ backgroundColor: theme.bgWhite(0.15) }}
                                        >
                                            <Image source={weatherImages[item?.day?.condition?.text]}
                                                className="h-11 w-11" />
                                            <Text className="text-white">{dayName}</Text>
                                            <Text className="text-white text-xl font-semibold">
                                                {item?.day?.avgtemp_c}&#176;
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </ScrollView>
                    </View>
                </SafeAreaView>
                )
            }

        </View>
    )
}